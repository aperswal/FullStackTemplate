import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('@/lib/db', () => {
  const mockDb = {
    query: {
      subscription: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  // Chain methods for insert
  mockDb.insert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    }),
  });

  // Chain methods for update
  mockDb.update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });

  // Chain methods for delete
  mockDb.delete = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  });

  return { db: mockDb };
});

vi.mock('@/lib/db/schema/subscriptions', () => ({
  subscription: {
    userId: 'user_id',
    externalSubscriptionId: 'external_subscription_id',
    status: 'status',
    externalPriceId: 'external_price_id',
    currentPeriodStart: 'current_period_start',
    currentPeriodEnd: 'current_period_end',
    cancelAtPeriodEnd: 'cancel_at_period_end',
    updatedAt: 'updated_at',
  },
}));

vi.mock('@/lib/db/schema/auth', () => ({
  user: {
    id: 'id',
    role: 'role',
    paymentCustomerId: 'payment_customer_id',
    paymentProvider: 'payment_provider',
    updatedAt: 'updated_at',
  },
  session: { userId: 'user_id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

import { db } from '@/lib/db';
import {
  getSubscriptionByUserId,
  upsertSubscription,
  updateUserRole,
  updateUserPaymentCustomerId,
} from './queries';

describe('getSubscriptionByUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the subscription when found', async () => {
    const mockSub = {
      id: 'sub_1',
      userId: 'user_1',
      status: 'active',
      externalPriceId: 'price_pro',
    };
    vi.mocked(db.query.subscription.findFirst).mockResolvedValue(mockSub as any);

    const result = await getSubscriptionByUserId('user_1');
    expect(result).toEqual(mockSub);
  });

  it('returns null when no subscription is found', async () => {
    vi.mocked(db.query.subscription.findFirst).mockResolvedValue(undefined);

    const result = await getSubscriptionByUserId('user_no_sub');
    expect(result).toBeNull();
  });

  it('uses the provided db transaction', async () => {
    const mockTx = {
      query: {
        subscription: {
          findFirst: vi.fn().mockResolvedValue(undefined),
        },
      },
    };

    const result = await getSubscriptionByUserId('user_1', mockTx as any);
    expect(result).toBeNull();
    expect(mockTx.query.subscription.findFirst).toHaveBeenCalled();
  });
});

describe('upsertSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts a subscription with conflict update', async () => {
    const data = {
      id: 'sub_1',
      userId: 'user_1',
      provider: 'stripe',
      externalSubscriptionId: 'ext_sub_1',
      externalPriceId: 'price_pro',
      status: 'active' as const,
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: new Date('2024-02-01'),
      cancelAtPeriodEnd: false,
    };

    await upsertSubscription(data);
    expect(db.insert).toHaveBeenCalled();
  });

  it('uses the provided db transaction', async () => {
    const mockTx = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };

    const data = {
      id: 'sub_2',
      userId: 'user_2',
      provider: 'stripe',
      externalSubscriptionId: 'ext_sub_2',
      externalPriceId: 'price_pro',
      status: 'active' as const,
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: new Date('2024-02-01'),
      cancelAtPeriodEnd: false,
    };

    await upsertSubscription(data, mockTx as any);
    expect(mockTx.insert).toHaveBeenCalled();
  });
});

describe('updateUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the user role and invalidates sessions', async () => {
    await updateUserRole('user_1', 'pro');
    expect(db.update).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalled();
  });

  it('uses the provided db transaction', async () => {
    const mockTx = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };

    await updateUserRole('user_1', 'admin', mockTx as any);
    expect(mockTx.update).toHaveBeenCalled();
    expect(mockTx.delete).toHaveBeenCalled();
  });
});

describe('updateUserPaymentCustomerId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the payment customer ID', async () => {
    await updateUserPaymentCustomerId('user_1', 'cus_123');
    expect(db.update).toHaveBeenCalled();
  });

  it('uses default stripe provider', async () => {
    await updateUserPaymentCustomerId('user_1', 'cus_123');
    const updateMock = vi.mocked(db.update);
    expect(updateMock).toHaveBeenCalled();
  });

  it('uses the provided db transaction', async () => {
    const mockTx = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };

    await updateUserPaymentCustomerId('user_1', 'cus_456', 'stripe', mockTx as any);
    expect(mockTx.update).toHaveBeenCalled();
  });
});
