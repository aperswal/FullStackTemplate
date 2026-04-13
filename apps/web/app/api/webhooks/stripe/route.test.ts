import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockConstructEvent,
  mockSubscriptionsRetrieve,
  mockInsert,
  mockUpdate,
  mockSelect,
  mockTransaction,
  mockRateLimitCheck,
} = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockSubscriptionsRetrieve: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockSelect: vi.fn(),
  mockTransaction: vi.fn(),
  mockRateLimitCheck: vi
    .fn()
    .mockResolvedValue({ success: true, limit: 120, remaining: 119, reset: 0 }),
}));

vi.mock('@/lib/payments/stripe', () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockSubscriptionsRetrieve },
  }),
}));

vi.mock('@/lib/payments/queries', () => ({
  upsertSubscription: vi.fn(),
  updateUserRole: vi.fn(),
}));

vi.mock('@/lib/payments/entitlements', () => ({
  syncRoleFromSubscription: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  createRequestLogger: () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    correlationId: 'test-id',
  }),
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  withCorrelation: (_id: string, fn: () => unknown) => fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  createRateLimiter: () => ({
    check: (...args: unknown[]) => mockRateLimitCheck(...args),
  }),
  RATE_LIMITS: {
    webhook: { limit: 120, window: 60 },
  },
}));

vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
    NODE_ENV: 'test',
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    select: mockSelect,
    transaction: mockTransaction,
  },
}));

vi.mock('@/lib/db/schema/webhook-events', () => ({
  webhookEvent: { id: 'id' },
}));

vi.mock('@/lib/db/schema/auth', () => ({
  user: { id: 'id', paymentCustomerId: 'payment_customer_id' },
}));

import { POST } from './route';
import { upsertSubscription, updateUserRole } from '@/lib/payments/queries';
import { syncRoleFromSubscription } from '@/lib/payments/entitlements';

function createRequest(body = '{}', headers: Record<string, string> = {}) {
  return new Request('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers: {
      'stripe-signature': 'sig_test',
      ...headers,
    },
  });
}

function makeEvent(type: string, data: unknown, id = 'evt_test123') {
  return { id, type, data: { object: data } };
}

function makeSub(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_123',
    status: 'active',
    cancel_at_period_end: false,
    metadata: { userId: 'user_1' },
    items: {
      data: [
        { price: { id: 'price_pro' }, current_period_start: 1000000, current_period_end: 2000000 },
      ],
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  // Default: idempotency claim succeeds (returns the inserted row)
  mockInsert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'evt_test123' }]),
      }),
    }),
  });

  // Default: user exists
  mockSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: 'user_1' }]),
      }),
    }),
  });

  // Default: transaction calls the callback
  mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
    await cb({});
  });

  // Default: update returns
  mockUpdate.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
});

describe('POST /api/webhooks/stripe', () => {
  it('rejects requests without stripe-signature', async () => {
    const request = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Signature verification failed');
    });
    const response = await POST(createRequest());
    expect(response.status).toBe(400);
  });

  it('handles duplicate webhook events (idempotency)', async () => {
    const event = makeEvent('checkout.session.completed', {});
    mockConstructEvent.mockReturnValue(event);
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]), // empty = duplicate
        }),
      }),
    });

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(vi.mocked(upsertSubscription)).not.toHaveBeenCalled();
  });

  it('handles checkout.session.completed', async () => {
    const sub = makeSub();
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'user_1' },
      subscription: 'sub_123',
    });
    mockConstructEvent.mockReturnValue(event);
    mockSubscriptionsRetrieve.mockResolvedValue(sub);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(vi.mocked(upsertSubscription)).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        externalSubscriptionId: 'sub_123',
        status: 'active',
      }),
      expect.anything(),
    );
    expect(vi.mocked(syncRoleFromSubscription)).toHaveBeenCalledWith('user_1', expect.anything());
  });

  it('skips checkout.session.completed when userId missing', async () => {
    const event = makeEvent('checkout.session.completed', {
      metadata: {},
      subscription: null,
    });
    mockConstructEvent.mockReturnValue(event);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(vi.mocked(upsertSubscription)).not.toHaveBeenCalled();
  });

  it('handles customer.subscription.deleted (downgrades to free)', async () => {
    const sub = makeSub({ status: 'canceled' });
    const event = makeEvent('customer.subscription.deleted', sub);
    mockConstructEvent.mockReturnValue(event);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(vi.mocked(updateUserRole)).toHaveBeenCalledWith('user_1', 'free', expect.anything());
  });

  it('handles customer.deleted (clears paymentCustomerId)', async () => {
    const event = makeEvent('customer.deleted', { id: 'cus_123' });
    mockConstructEvent.mockReturnValue(event);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('handles unrecognized event type gracefully', async () => {
    const event = makeEvent('some.unknown.event', {});
    mockConstructEvent.mockReturnValue(event);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
  });

  it('returns 200 even when processing fails (prevents Stripe retries)', async () => {
    makeSub(); // ensure helper works; the sub is constructed inside the route via stripe.subscriptions.retrieve
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'user_1' },
      subscription: 'sub_123',
    });
    mockConstructEvent.mockReturnValue(event);
    mockSubscriptionsRetrieve.mockRejectedValue(new Error('Stripe API down'));
    // Mock the error update path
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
  });

  it('handles customer.subscription.updated event', async () => {
    const sub = makeSub();
    const event = makeEvent('customer.subscription.updated', sub);
    mockConstructEvent.mockReturnValue(event);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
  });

  it('handles charge.refunded event', async () => {
    const event = makeEvent('charge.refunded', { id: 'ch_123', amount_refunded: 500 });
    mockConstructEvent.mockReturnValue(event);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
  });

  it('handles invoice.paid event', async () => {
    const sub = makeSub();
    const event = makeEvent('invoice.paid', {
      parent: { subscription_details: { subscription: 'sub_123' } },
    });
    mockConstructEvent.mockReturnValue(event);
    mockSubscriptionsRetrieve.mockResolvedValue(sub);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
  });

  it('handles invoice.payment_failed event', async () => {
    const sub = makeSub();
    const event = makeEvent('invoice.payment_failed', {
      parent: { subscription_details: { subscription: 'sub_123' } },
    });
    mockConstructEvent.mockReturnValue(event);
    mockSubscriptionsRetrieve.mockResolvedValue(sub);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimitCheck.mockResolvedValueOnce({
      success: false,
      limit: 120,
      remaining: 0,
      reset: 0,
    });

    const response = await POST(createRequest());
    expect(response.status).toBe(429);
  });

  it('still returns 200 when webhook event status update fails', async () => {
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'user_1' },
      subscription: 'sub_123',
    });
    mockConstructEvent.mockReturnValue(event);
    mockSubscriptionsRetrieve.mockRejectedValue(new Error('Stripe API down'));

    // Make the status update also fail
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error('DB write failed')),
      }),
    });

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
  });

  it('skips processing when user does not exist', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]), // no user found
        }),
      }),
    });

    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'nonexistent' },
      subscription: 'sub_123',
    });
    mockConstructEvent.mockReturnValue(event);

    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(vi.mocked(upsertSubscription)).not.toHaveBeenCalled();
  });
});
