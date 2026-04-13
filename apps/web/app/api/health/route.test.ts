import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  }),
  createRequestLogger: () => ({
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    correlationId: 'test-correlation-id',
  }),
  withCorrelation: (_id: string, fn: () => unknown) => fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  createRateLimiter: () => ({
    check: vi.fn().mockResolvedValue({ success: true, limit: 120, remaining: 119, reset: 0 }),
  }),
  RATE_LIMITS: {
    auth: { limit: 10, window: 60 },
    api: { limit: 60, window: 60 },
    mcp: { limit: 30, window: 60 },
    health: { limit: 120, window: 60 },
  },
}));

import { GET } from './route';
import { db } from '@/lib/db';

function createRequest() {
  return new NextRequest('http://localhost:3000/api/health', { method: 'GET' });
}

describe('GET /api/health', () => {
  it('returns 200 with status "healthy" when db is healthy', async () => {
    vi.mocked(db.execute).mockResolvedValueOnce([] as never);
    const response = await GET(createRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.timestamp).toBeDefined();
  });

  it('returns 503 when db query fails', async () => {
    vi.mocked(db.execute).mockRejectedValueOnce(new Error('connection refused'));
    const response = await GET(createRequest());
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.error.blame).toBe('server');
  });

  it('includes x-request-id header', async () => {
    vi.mocked(db.execute).mockResolvedValueOnce([] as never);
    const response = await GET(createRequest());
    expect(response.headers.get('x-request-id')).toBeDefined();
  });
});
