import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env to enable Upstash path
vi.mock('@/lib/env', () => ({
  env: {
    UPSTASH_REDIS_REST_URL: 'https://fake-redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'fake-token',
    DEPLOY_TARGET: 'vercel',
  },
}));

const mockLimit = vi.fn();
const mockRedisConstructor = vi.fn();
const mockRatelimitConstructor = vi.fn();
const mockFixedWindow = vi.fn((_limit: number, _window: string) => 'fixed-window-limiter');

class MockRedis {
  constructor(opts: any) {
    mockRedisConstructor(opts);
  }
}

class MockRatelimit {
  limit: typeof mockLimit;
  constructor(opts: any) {
    mockRatelimitConstructor(opts);
    this.limit = mockLimit;
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

// Must import after mocks
import { createRateLimiter } from './index';

describe('createRateLimiter (Upstash)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an Upstash rate limiter when env vars are set', async () => {
    mockLimit.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    });

    const limiter = await createRateLimiter({ limit: 10, window: 60 });
    const result = await limiter.check('test-user');

    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(typeof result.reset).toBe('number');
    expect(mockRedisConstructor).toHaveBeenCalledWith({
      url: 'https://fake-redis.upstash.io',
      token: 'fake-token',
    });
    expect(mockFixedWindow).toHaveBeenCalledWith(10, '60 s');
    expect(mockRatelimitConstructor).toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith('test-user');
  });

  it('converts reset from ms to seconds', async () => {
    const resetMs = 1700000000000;
    mockLimit.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: resetMs,
    });

    const limiter = await createRateLimiter({ limit: 10, window: 60 });
    const result = await limiter.check('test-user');

    expect(result.reset).toBe(Math.floor(resetMs / 1000));
  });

  it('returns success=false when rate limited', async () => {
    mockLimit.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const limiter = await createRateLimiter({ limit: 10, window: 60 });
    const result = await limiter.check('test-user');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('caches the Upstash limiter for same config', async () => {
    mockLimit.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 30000,
    });

    const limiter1 = createRateLimiter({ limit: 5, window: 30 });
    const limiter2 = createRateLimiter({ limit: 5, window: 30 });

    // Both should be the same promise
    expect(limiter1).toBe(limiter2);
    await limiter1;
    expect(mockRatelimitConstructor).toHaveBeenCalledTimes(1);
  });
});
