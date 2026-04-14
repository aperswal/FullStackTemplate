import { describe, it, expect, vi } from 'vitest';

const mockRedisConstructor = vi.fn();
const mockRatelimitConstructor = vi.fn();
const mockFixedWindow = vi.fn((_limit: number, _window: string) => 'limiter');

vi.mock('@/lib/env', () => ({
  env: {
    UPSTASH_REDIS_REST_URL: 'https://fake-redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'a-token',
    DEPLOY_TARGET: 'vercel',
  },
}));

class MockRedis {
  constructor(opts: any) {
    mockRedisConstructor(opts);
  }
}

class MockRatelimit {
  constructor(opts: any) {
    mockRatelimitConstructor(opts);
  }
  static fixedWindow(limit: number, window: string) {
    return mockFixedWindow(limit, window);
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
  it('uses the Upstash branch when both env vars are set', async () => {
    const limiter = await createRateLimiter({ limit: 15, window: 45 });
    expect(limiter).toBeDefined();
    expect(typeof limiter.check).toBe('function');
    expect(mockRedisConstructor).toHaveBeenCalledWith({
      url: 'https://fake-redis.upstash.io',
      token: 'a-token',
    });
    expect(mockFixedWindow).toHaveBeenCalledWith(15, '45 s');
    expect(mockRatelimitConstructor).toHaveBeenCalled();
  });
});
