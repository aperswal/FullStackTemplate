import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockUpdate, mockGetSession } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockGetSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    update: mockUpdate,
  },
}));

vi.mock('@/lib/db/schema/auth', () => ({
  user: { id: 'id' },
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

import { updateProfile } from './actions';

beforeEach(() => {
  vi.clearAllMocks();

  mockUpdate.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
});

describe('updateProfile', () => {
  it('throws 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(updateProfile({ name: 'Test' })).rejects.toThrow('Not authenticated');
  });

  it('updates the user name when authenticated', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user_1', name: 'Old', email: 'test@example.com' },
    });

    const result = await updateProfile({ name: 'New Name' });
    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('rejects invalid input (empty name)', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user_1', name: 'Old', email: 'test@example.com' },
    });

    await expect(updateProfile({ name: '' })).rejects.toThrow();
  });

  it('accepts optional image URL', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user_1', name: 'Old', email: 'test@example.com' },
    });

    const result = await updateProfile({ name: 'Test', image: 'https://example.com/photo.jpg' });
    expect(result).toEqual({ success: true });
  });
});
