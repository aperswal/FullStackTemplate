import { env } from '@/lib/env';
import { ServerError } from '@/lib/errors';

const MS_PER_SECOND = 1000;
const CLEANUP_INTERVAL_MS = 60_000;

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window size in seconds */
  window: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix timestamp (seconds) when the window resets */
  reset: number;
}

interface RateLimiter {
  check(identifier: string): RateLimitResult | Promise<RateLimitResult>;
}

export const RATE_LIMITS = {
  auth: { limit: 10, window: 60 },
  api: { limit: 60, window: 60 },
  mcp: { limit: 30, window: 60 },
  health: { limit: 120, window: 60 },
  og: { limit: 30, window: 60 },
  webhook: { limit: 120, window: 60 },
} as const satisfies Record<string, RateLimitConfig>;

export type RateLimitTier = keyof typeof RATE_LIMITS;

// In-memory rate limiter for Docker/self-hosted mode
function createInMemoryRateLimiter(config: RateLimitConfig): RateLimiter {
  const store = new Map<string, { count: number; resetAt: number }>();

  const cleanup = setInterval(() => {
    const now = Math.floor(Date.now() / MS_PER_SECOND);
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Prevent the interval from keeping the process alive
  if (typeof cleanup === 'object' && 'unref' in cleanup) {
    cleanup.unref();
  }

  return {
    check(identifier: string): RateLimitResult {
      const now = Math.floor(Date.now() / MS_PER_SECOND);
      const entry = store.get(identifier);

      if (!entry || entry.resetAt <= now) {
        const resetAt = now + config.window;
        store.set(identifier, { count: 1, resetAt });
        return { success: true, limit: config.limit, remaining: config.limit - 1, reset: resetAt };
      }

      entry.count += 1;
      const remaining = Math.max(0, config.limit - entry.count);
      return {
        success: entry.count <= config.limit,
        limit: config.limit,
        remaining,
        reset: entry.resetAt,
      };
    },
  };
}

// Upstash rate limiter for Vercel/SaaS mode
async function createUpstashRateLimiter(config: RateLimitConfig): Promise<RateLimiter> {
  const { Ratelimit } = await import('@upstash/ratelimit');
  const { Redis } = await import('@upstash/redis');

  if (
    env.UPSTASH_REDIS_REST_URL === undefined ||
    env.UPSTASH_REDIS_REST_URL === '' ||
    env.UPSTASH_REDIS_REST_TOKEN === undefined ||
    env.UPSTASH_REDIS_REST_TOKEN === ''
  ) {
    throw new ServerError(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for Upstash rate limiting',
    );
  }

  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(config.limit, `${config.window} s`),
    analytics: false,
  });

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: Math.floor(result.reset / MS_PER_SECOND),
      };
    },
  };
}

// Cache rate limiters per config to avoid creating duplicates
const limiterCache = new Map<string, RateLimiter | Promise<RateLimiter>>();

export function createRateLimiter(config: RateLimitConfig): RateLimiter | Promise<RateLimiter> {
  const key = `${config.limit}:${config.window}`;
  const cached = limiterCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const useUpstash =
    env.UPSTASH_REDIS_REST_URL !== undefined &&
    env.UPSTASH_REDIS_REST_URL !== '' &&
    env.UPSTASH_REDIS_REST_TOKEN !== undefined &&
    env.UPSTASH_REDIS_REST_TOKEN !== '';

  if (useUpstash) {
    const promise = createUpstashRateLimiter(config);
    limiterCache.set(key, promise);
    // Replace the promise with the resolved limiter once ready
    void promise.then((limiter) => limiterCache.set(key, limiter)).catch(() => {});
    return promise;
  }

  const limiter = createInMemoryRateLimiter(config);
  limiterCache.set(key, limiter);
  return limiter;
}
