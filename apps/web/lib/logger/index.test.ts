import { describe, it, expect, vi } from 'vitest';

import {
  logger,
  createLogger,
  createRequestLogger,
  withCorrelation,
  requestContext,
} from './index';

describe('logger', () => {
  it('exports a pino logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });
});

describe('createLogger', () => {
  it('returns a child logger with context', () => {
    const child = createLogger('test-context');
    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
  });
});

describe('createRequestLogger', () => {
  it('returns a logger and correlation ID', () => {
    const result = createRequestLogger();
    expect(result.logger).toBeDefined();
    expect(typeof result.correlationId).toBe('string');
    expect(result.correlationId.length).toBeGreaterThan(0);
  });

  it('uses provided request ID as correlation ID', () => {
    const result = createRequestLogger('custom-req-id');
    expect(result.correlationId).toBe('custom-req-id');
  });

  it('generates a UUID when no request ID provided', () => {
    const result = createRequestLogger();
    // UUID v4 format
    expect(result.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('generates unique IDs for each call', () => {
    const r1 = createRequestLogger();
    const r2 = createRequestLogger();
    expect(r1.correlationId).not.toBe(r2.correlationId);
  });
});

describe('withCorrelation', () => {
  it('runs the function within a correlation context', () => {
    const result = withCorrelation('test-corr-id', () => {
      const store = requestContext.getStore();
      return store?.correlationId;
    });
    expect(result).toBe('test-corr-id');
  });

  it('returns the value from the wrapped function', () => {
    const result = withCorrelation('id', () => 42);
    expect(result).toBe(42);
  });

  it('makes correlation ID available to the logger mixin', () => {
    withCorrelation('mixin-test-id', () => {
      // Calling a log method triggers the mixin, which reads requestContext.getStore()
      // and takes the truthy branch of the ternary to include the correlationId.
      logger.info('test message inside correlation context');
      const store = requestContext.getStore();
      expect(store).toEqual({ correlationId: 'mixin-test-id' });
    });
  });
});

describe('logger configuration', () => {
  it('uses configured LOG_LEVEL when available', async () => {
    vi.resetModules();
    vi.doMock('@/lib/env', () => ({
      env: { NODE_ENV: 'test', LOG_LEVEL: 'warn' },
    }));
    const mod = await import('./index');
    expect(mod.logger.level).toBe('warn');
    vi.doUnmock('@/lib/env');
  });

  it('uses production-level logger config in production mode', async () => {
    vi.resetModules();
    vi.doMock('@/lib/env', () => ({
      env: { NODE_ENV: 'production', LOG_LEVEL: undefined },
    }));
    const mod = await import('./index');
    expect(mod.logger.level).toBe('info');
    vi.doUnmock('@/lib/env');
  });
});
