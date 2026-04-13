/** Structured logger with provider-agnostic interface and request correlation. */

import { AsyncLocalStorage } from 'node:async_hooks';
import pino from 'pino';

import { env } from '@/lib/env';

export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

interface RequestContext {
  correlationId: string;
}

const isProduction = env.NODE_ENV === 'production';

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const logger = pino({
  level: env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  redact: {
    paths: [
      'password',
      'secret',
      'token',
      'authorization',
      'cookie',
      'apiKey',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  mixin() {
    const ctx = requestContext.getStore();
    return ctx ? { correlationId: ctx.correlationId } : {};
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
});

export function createLogger(context: string): pino.Logger {
  return logger.child({ context });
}

export function createRequestLogger(requestId?: string): {
  logger: pino.Logger;
  correlationId: string;
} {
  const correlationId = requestId ?? crypto.randomUUID();
  return { logger: logger.child({ correlationId }), correlationId };
}

/** Run a function within a request correlation context. */
export function withCorrelation<T>(correlationId: string, fn: () => T): T {
  return requestContext.run({ correlationId }, fn);
}
