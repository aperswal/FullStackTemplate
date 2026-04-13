// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function setEnv(key: string, value: string) {
  Object.defineProperty(process.env, key, { value, writable: true, configurable: true });
}

describe('env cross-validation (instrumentation)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('skips validation when SKIP_ENV_VALIDATION is set', async () => {
    process.env.SKIP_ENV_VALIDATION = 'true';
    const { validateEnvCrossConstraints } = await import('./instrumentation');
    await expect(validateEnvCrossConstraints()).resolves.toBeUndefined();
  });

  it('throws when STRIPE_SECRET_KEY is set without STRIPE_WEBHOOK_SECRET', async () => {
    process.env.SKIP_ENV_VALIDATION = '';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.BETTER_AUTH_SECRET = 'a'.repeat(32);
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = '';

    const { validateEnvCrossConstraints } = await import('./instrumentation');
    await expect(validateEnvCrossConstraints()).rejects.toThrow(
      'STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is missing',
    );
  });

  it('warns when DEPLOY_TARGET=vercel but no RESEND_API_KEY', async () => {
    process.env.SKIP_ENV_VALIDATION = '';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.BETTER_AUTH_SECRET = 'a'.repeat(32);
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.DEPLOY_TARGET = 'vercel';
    process.env.RESEND_API_KEY = '';

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { validateEnvCrossConstraints } = await import('./instrumentation');
    await validateEnvCrossConstraints();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('RESEND_API_KEY is not set'));
    warnSpy.mockRestore();
  });

  it('throws when UPSTASH_REDIS_REST_URL is set without token', async () => {
    process.env.SKIP_ENV_VALIDATION = '';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.BETTER_AUTH_SECRET = 'a'.repeat(32);
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = '';

    const { validateEnvCrossConstraints } = await import('./instrumentation');
    await expect(validateEnvCrossConstraints()).rejects.toThrow(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must both be set or both be empty',
    );
  });

  it('warns when production uses default EMAIL_FROM', async () => {
    process.env.SKIP_ENV_VALIDATION = '';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.BETTER_AUTH_SECRET = 'a'.repeat(32);
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    setEnv('NODE_ENV', 'production');
    process.env.EMAIL_FROM = '';

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { validateEnvCrossConstraints } = await import('./instrumentation');
    await validateEnvCrossConstraints();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('EMAIL_FROM is still the default'),
    );
    warnSpy.mockRestore();
  });
});
