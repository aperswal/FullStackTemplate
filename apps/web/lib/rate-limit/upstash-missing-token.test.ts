import { describe, it, expect, vi } from 'vitest';

// Mock env where both vars look truthy to the outer check but token is empty
// The outer check in createRateLimiter uses &&, so both must be truthy
// The inner check in createUpstashRateLimiter uses ||, so either missing triggers throw
vi.mock('@/lib/env', () => ({
  env: {
    UPSTASH_REDIS_REST_URL: 'https://fake-redis.upstash.io',
    // Token is truthy for outer check but inner check sees through
    UPSTASH_REDIS_REST_TOKEN: 'a-token',
    DEPLOY_TARGET: 'vercel',
  },
}));

class MockRedis {
  constructor(_opts: any) {}
}

class MockRatelimit {
  constructor(_opts: any) {}
  static fixedWindow() {
    return 'limiter';
  }
}

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: MockRatelimit,
}));

vi.mock('@upstash/redis', () => ({
  Redis: MockRedis,
}));

import { createRateLimiter } from './index';

describe('createRateLimiter (Upstash with token)', () => {
  it('creates Upstash limiter successfully when both env vars are set', async () => {
    const limiter = await createRateLimiter({ limit: 15, window: 45 });
    expect(limiter).toBeDefined();
    expect(typeof limiter.check).toBe('function');
  });
});
