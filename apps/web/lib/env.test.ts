// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env', () => {
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
    delete process.env.DATABASE_URL;
    const mod = await import('./env');
    expect(mod.env.NODE_ENV).toBe('test');
    expect(mod.env.DATABASE_URL).toBeUndefined();
  });

  it('fails validation when required env vars are missing and skip flag is absent', async () => {
    delete process.env.SKIP_ENV_VALIDATION;
    delete process.env.DATABASE_URL;
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    await expect(import('./env')).rejects.toThrow();
  });

  it('exports env object with expected shape', async () => {
    process.env.SKIP_ENV_VALIDATION = 'true';
    process.env.DEPLOY_TARGET = 'docker';
    const { env } = await import('./env');
    expect(env).toMatchObject({
      NODE_ENV: 'test',
      DEPLOY_TARGET: 'docker',
    });
  });
});
