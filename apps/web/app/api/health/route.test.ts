import { describe, it, expect, vi } from 'vitest';

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
  }),
}));

import { GET } from './route';
import { db } from '@/lib/db';

describe('GET /api/health', () => {
  it('returns 200 with status "healthy" when db is healthy', async () => {
    vi.mocked(db.execute).mockResolvedValueOnce([] as never);
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.timestamp).toBeDefined();
  });

  it('returns 503 with status "unhealthy" when db query fails', async () => {
    vi.mocked(db.execute).mockRejectedValueOnce(new Error('connection refused'));
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe('unhealthy');
  });
});
