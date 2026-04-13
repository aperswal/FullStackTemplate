import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/auth/server', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
  withCorrelation: (_id: string, fn: () => unknown) => fn(),
}));

// Mock isRedirectError to recognize our sentinel
vi.mock('next/dist/client/components/redirect-error', () => ({
  isRedirectError: (err: unknown) => err instanceof Error && err.message === '__NEXT_REDIRECT__',
}));

import { withServerAction } from './with-server-action';
import { ClientError } from '@/lib/errors';

const session = {
  user: { id: 'user_1', name: 'Test', email: 'test@example.com' },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSession.mockResolvedValue(session);
});

describe('withServerAction', () => {
  it('re-throws redirect errors without logging them as failures', async () => {
    const redirectError = new Error('__NEXT_REDIRECT__');
    const action = withServerAction('test', () => {
      throw redirectError;
    });

    await expect(action({})).rejects.toThrow('__NEXT_REDIRECT__');
  });

  it('re-throws ClientError without logging it as a server failure', async () => {
    const clientError = new ClientError('Bad input', { statusCode: 400 });
    const action = withServerAction('test', () => {
      throw clientError;
    });

    await expect(action({})).rejects.toThrow(clientError);
  });

  it('re-throws unexpected errors after logging', async () => {
    const unexpected = new TypeError('Cannot read property');
    const action = withServerAction('test', () => {
      throw unexpected;
    });

    await expect(action({})).rejects.toThrow(unexpected);
  });
});
