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
    expect(child.bindings()).toMatchObject({ context: 'test-context' });
    expect(typeof child.info).toBe('function');
  });
});

describe('createRequestLogger', () => {
  it('returns a logger and correlation ID', () => {
    const result = createRequestLogger();
    expect(typeof result.correlationId).toBe('string');
    expect(result.correlationId.length).toBeGreaterThan(0);
    expect(result.logger.bindings()).toMatchObject({ correlationId: result.correlationId });
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

  it('makes correlation ID available to the logger mixin', async () => {
    const output: string[] = [];
    const { default: pino } = await import('pino');
    const testLogger = pino(
      {
        mixin() {
          const ctx = requestContext.getStore();
          return ctx ? { correlationId: ctx.correlationId } : {};
        },
      },
      { write: (chunk: string) => output.push(chunk) },
    );

    withCorrelation('mixin-test-id', () => {
      testLogger.info('test message inside correlation context');
    });

    expect(JSON.parse(output[0])).toMatchObject({
      correlationId: 'mixin-test-id',
      msg: 'test message inside correlation context',
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
