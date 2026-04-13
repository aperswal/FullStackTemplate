import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
    DEPLOY_TARGET: 'docker',
  },
}));

import { createRateLimiter, RATE_LIMITS } from './index';

describe('RATE_LIMITS', () => {
  it('defines auth tier with 10 req/min', () => {
    expect(RATE_LIMITS.auth).toEqual({ limit: 10, window: 60 });
  });

  it('defines api tier with 60 req/min', () => {
    expect(RATE_LIMITS.api).toEqual({ limit: 60, window: 60 });
  });

  it('defines mcp tier with 30 req/min', () => {
    expect(RATE_LIMITS.mcp).toEqual({ limit: 30, window: 60 });
  });

  it('defines health tier with 120 req/min', () => {
    expect(RATE_LIMITS.health).toEqual({ limit: 120, window: 60 });
  });
});

describe('createRateLimiter (in-memory)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows requests within the limit', async () => {
    const limiter = await createRateLimiter({ limit: 3, window: 60 });
    const result = await limiter.check('user-1');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.limit).toBe(3);
  });

  it('blocks requests exceeding the limit', async () => {
    const limiter = await createRateLimiter({ limit: 2, window: 60 });

    await limiter.check('user-2');
    await limiter.check('user-2');
    const result = await limiter.check('user-2');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks different identifiers independently', async () => {
    const limiter = await createRateLimiter({ limit: 1, window: 60 });

    const result1 = await limiter.check('user-a');
    const result2 = await limiter.check('user-b');

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it('resets after window expires', async () => {
    vi.useFakeTimers();
    const limiter = await createRateLimiter({ limit: 1, window: 1 });

    await limiter.check('user-3');
    const blocked = await limiter.check('user-3');
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(2000);

    const afterReset = await limiter.check('user-3');
    expect(afterReset.success).toBe(true);

    vi.useRealTimers();
  });

  it('returns correct reset timestamp', async () => {
    const limiter = await createRateLimiter({ limit: 5, window: 60 });
    const result = await limiter.check('user-4');

    const now = Math.floor(Date.now() / 1000);
    expect(result.reset).toBeGreaterThanOrEqual(now);
    expect(result.reset).toBeLessThanOrEqual(now + 61);
  });

  it('returns cached limiter for same config', () => {
    const limiter1 = createRateLimiter({ limit: 100, window: 30 });
    const limiter2 = createRateLimiter({ limit: 100, window: 30 });
    expect(limiter1).toBe(limiter2);
  });

  it('creates different limiters for different configs', () => {
    const limiter1 = createRateLimiter({ limit: 100, window: 30 });
    const limiter2 = createRateLimiter({ limit: 200, window: 30 });
    expect(limiter1).not.toBe(limiter2);
  });

  it('cleanup interval removes expired entries', async () => {
    vi.useFakeTimers();

    // Use a unique config to avoid cache collisions
    const limiter = await createRateLimiter({ limit: 10, window: 1 });
    await limiter.check('cleanup-test-user');

    // Advance past the window so the entry expires
    vi.advanceTimersByTime(2000);

    // Advance past the 60s cleanup interval to trigger cleanup
    vi.advanceTimersByTime(60_000);

    // After cleanup, the entry should be gone — next check should start fresh
    const result = await limiter.check('cleanup-test-user');
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);

    vi.useRealTimers();
  });

  it('remaining count does not go below 0', async () => {
    const limiter = await createRateLimiter({ limit: 1, window: 60 });
    await limiter.check('over-limit');
    await limiter.check('over-limit');
    const result = await limiter.check('over-limit');
    expect(result.remaining).toBe(0);
  });
});

describe('createUpstashRateLimiter (env validation)', () => {
  it('throws ServerError when Upstash env vars are missing', async () => {
    vi.resetModules();

    let callCount = 0;
    vi.doMock('@/lib/env', () => ({
      env: {
        get UPSTASH_REDIS_REST_URL() {
          callCount++;
          // First two reads (in createRateLimiter): return a truthy value
          // Next reads (inside createUpstashRateLimiter): return undefined
          return callCount <= 2 ? 'https://fake.upstash.io' : undefined;
        },
        get UPSTASH_REDIS_REST_TOKEN() {
          return 'fake-token';
        },
        DEPLOY_TARGET: 'vercel',
      },
    }));

    vi.doMock('@upstash/ratelimit', () => ({ Ratelimit: vi.fn() }));
    vi.doMock('@upstash/redis', () => ({ Redis: vi.fn() }));

    const mod = await import('./index');
    const promise = mod.createRateLimiter({ limit: 999, window: 999 });

    // Catch the floating .then() rejection from the cache replacement logic
    if (promise instanceof Promise) {
      promise.catch(() => {});
    }

    await expect(promise).rejects.toThrow(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required',
    );

    vi.doUnmock('@/lib/env');
    vi.doUnmock('@upstash/ratelimit');
    vi.doUnmock('@upstash/redis');
  });
});
