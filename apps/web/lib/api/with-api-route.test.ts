import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/server', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  createRequestLogger: (id?: string) => ({
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    correlationId: id ?? 'test-id',
  }),
  withCorrelation: (_id: string, fn: () => unknown) => fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  createRateLimiter: vi.fn().mockReturnValue({
    check: vi.fn().mockResolvedValue({ success: true, limit: 60, remaining: 59, reset: 0 }),
  }),
  RATE_LIMITS: {
    auth: { limit: 10, window: 60 },
    api: { limit: 60, window: 60 },
    mcp: { limit: 30, window: 60 },
    health: { limit: 120, window: 60 },
  },
}));

import { withApiRoute } from './with-api-route';
import { auth } from '@/lib/auth/server';
import { NextResponse } from 'next/server';
import { ClientError, ServerError } from '@/lib/errors';
import { createRateLimiter } from '@/lib/rate-limit';

function createRequest(method = 'GET', url = 'http://localhost:3000/api/test') {
  return new NextRequest(url, { method });
}

/** Default options for tests where auth/rateLimit/methods aren't the focus */
const defaults = { rateLimit: 'api' as const, methods: ['GET' as const] };

describe('withApiRoute', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    vi.mocked(createRateLimiter).mockReturnValue({
      check: vi.fn().mockResolvedValue({ success: true, limit: 60, remaining: 59, reset: 0 }),
    });
  });

  it('adds x-request-id header to successful responses', async () => {
    const handler = withApiRoute({ auth: 'none', ...defaults }, () => {
      return NextResponse.json({ ok: true });
    });

    const response = await handler(createRequest());
    expect(response.headers.get('x-request-id')).toBeDefined();
  });

  it('uses x-request-id from incoming request if present', async () => {
    const handler = withApiRoute({ auth: 'none', ...defaults }, () => {
      return NextResponse.json({ ok: true });
    });

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: { 'x-request-id': 'custom-id-123' },
    });

    const response = await handler(request);
    expect(response.headers.get('x-request-id')).toBe('custom-id-123');
  });

  it('returns 405 for disallowed HTTP methods', async () => {
    const handler = withApiRoute({ auth: 'none', rateLimit: 'api', methods: ['GET'] }, () =>
      NextResponse.json({ ok: true }),
    );

    const response = await handler(createRequest('POST'));
    expect(response.status).toBe(405);
    const body = await response.json();
    expect(body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('returns 401 when auth is required and no session exists', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const handler = withApiRoute({ auth: 'required', ...defaults }, () =>
      NextResponse.json({ ok: true }),
    );

    const response = await handler(createRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.blame).toBe('client');
  });

  it('passes session to handler when auth is required and session exists', async () => {
    const mockSession = { user: { id: 'user-1' }, session: { id: 'sess-1' } };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);

    let receivedSession = null;
    const handler = withApiRoute({ auth: 'required', ...defaults }, (_req, ctx) => {
      receivedSession = ctx.session;
      return NextResponse.json({ ok: true });
    });

    const response = await handler(createRequest());
    expect(response.status).toBe(200);
    expect(receivedSession).toEqual(mockSession);
  });

  it('passes null session when auth is optional and no session exists', async () => {
    let receivedSession: unknown = 'not-set';
    const handler = withApiRoute({ auth: 'optional', ...defaults }, (_req, ctx) => {
      receivedSession = ctx.session;
      return NextResponse.json({ ok: true });
    });

    await handler(createRequest());
    expect(receivedSession).toBeNull();
  });

  it('catches ClientError and returns structured response', async () => {
    const handler = withApiRoute({ auth: 'none', ...defaults }, () => {
      throw new ClientError('Bad input', { statusCode: 422 });
    });

    const response = await handler(createRequest());
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error.blame).toBe('client');
  });

  it('catches ServerError and returns 500 response', async () => {
    const handler = withApiRoute({ auth: 'none', ...defaults }, () => {
      throw new ServerError('Something broke');
    });

    const response = await handler(createRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.blame).toBe('server');
  });

  it('catches unknown errors and returns generic 500', async () => {
    const handler = withApiRoute({ auth: 'none', ...defaults }, () => {
      throw new Error('unexpected');
    });

    const response = await handler(createRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe('ServerError');
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(createRateLimiter).mockReturnValue({
      check: vi.fn().mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 30,
      }),
    });

    const handler = withApiRoute({ auth: 'none', rateLimit: 'api', methods: ['GET'] }, () =>
      NextResponse.json({ ok: true }),
    );

    const response = await handler(createRequest());
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeDefined();
  });

  it('handles session retrieval failure gracefully when auth is optional', async () => {
    vi.mocked(auth.api.getSession).mockRejectedValue(new Error('Session service down'));

    const handler = withApiRoute({ auth: 'optional', ...defaults }, (_req, ctx) => {
      return NextResponse.json({ session: ctx.session });
    });

    const response = await handler(createRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.session).toBeNull();
  });

  it('returns 401 when session retrieval fails and auth is required', async () => {
    vi.mocked(auth.api.getSession).mockRejectedValue(new Error('Session service down'));

    const handler = withApiRoute({ auth: 'required', ...defaults }, () =>
      NextResponse.json({ ok: true }),
    );

    const response = await handler(createRequest());
    expect(response.status).toBe(401);
  });

  it('accepts custom rate limit config object', async () => {
    const handler = withApiRoute(
      { auth: 'none', rateLimit: { limit: 5, window: 30 }, methods: ['GET'] },
      () => NextResponse.json({ ok: true }),
    );

    const response = await handler(createRequest());
    expect(response.status).toBe(200);
  });

  it('allows request through when rate limiter fails', async () => {
    vi.mocked(createRateLimiter).mockReturnValue({
      check: vi.fn().mockRejectedValue(new Error('Redis down')),
    });

    const handler = withApiRoute({ auth: 'none', rateLimit: 'api', methods: ['GET'] }, () =>
      NextResponse.json({ ok: true }),
    );

    const response = await handler(createRequest());
    expect(response.status).toBe(200);
  });
});
