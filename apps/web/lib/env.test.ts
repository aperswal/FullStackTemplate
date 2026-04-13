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
    const mod = await import('./env');
    expect(mod.env).toBeDefined();
  });

  it('exports env object with expected shape', async () => {
    process.env.SKIP_ENV_VALIDATION = 'true';
    const { env } = await import('./env');
    expect(env).toHaveProperty('NODE_ENV');
    expect(env).toHaveProperty('DEPLOY_TARGET');
  });
});
