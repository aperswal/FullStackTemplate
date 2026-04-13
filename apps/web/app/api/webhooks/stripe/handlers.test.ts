import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Stripe from 'stripe';
import type { Logger } from 'pino';

const { mockSelect, mockTransaction, mockUpdate } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockTransaction: vi.fn(),
  mockUpdate: vi.fn(),
}));

const mockUpsertSubscription = vi.hoisted(() => vi.fn());
const mockUpdateUserRole = vi.hoisted(() => vi.fn());
const mockSyncRoleFromSubscription = vi.hoisted(() => vi.fn());

vi.mock('@/lib/payments/queries', () => ({
  upsertSubscription: mockUpsertSubscription,
  updateUserRole: mockUpdateUserRole,
}));

vi.mock('@/lib/payments/entitlements', () => ({
  syncRoleFromSubscription: mockSyncRoleFromSubscription,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: mockSelect,
    transaction: mockTransaction,
    update: mockUpdate,
  },
}));

vi.mock('@/lib/db/schema/auth', () => ({
  user: { id: 'id', paymentCustomerId: 'payment_customer_id' },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  handleCheckoutCompleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleChargeRefunded,
  handleCustomerDeleted,
} from './handlers';

function createMockLogger(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as Logger;
}

function createMockStripe(subOverrides: Record<string, unknown> = {}): Stripe {
  return {
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue(makeSub(subOverrides)),
    },
  } as unknown as Stripe;
}

function makeEvent(type: string, data: unknown, id = 'evt_test_handler'): Stripe.Event {
  return { id, type, data: { object: data } } as unknown as Stripe.Event;
}

function makeSub(overrides: Record<string, unknown> = {}): Stripe.Subscription {
  return {
    id: 'sub_123',
    status: 'active',
    cancel_at_period_end: false,
    metadata: { userId: 'user_1' },
    items: {
      data: [
        {
          price: { id: 'price_pro' },
          current_period_start: 1000000,
          current_period_end: 2000000,
        },
      ],
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function setupUserExists(exists: boolean) {
  mockSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(exists ? [{ id: 'user_1' }] : []),
      }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  setupUserExists(true);

  mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
    await cb({});
  });

  mockUpdate.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
});

describe('handleCheckoutCompleted', () => {
  it('skips when event data is missing required keys', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('checkout.session.completed', { subscription: 'sub_123' });

    await handleCheckoutCompleted(event, stripe, log);

    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'checkout.session.completed' }),
      'Unexpected event data shape for checkout session',
    );
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it('processes a valid checkout session', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'user_1' },
      subscription: 'sub_123',
    });

    await handleCheckoutCompleted(event, stripe, log);

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        provider: 'stripe',
        externalSubscriptionId: 'sub_123',
        externalPriceId: 'price_pro',
        status: 'active',
        cancelAtPeriodEnd: false,
      }),
      expect.anything(),
    );
    expect(mockSyncRoleFromSubscription).toHaveBeenCalledWith('user_1', expect.anything());
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1', subscriptionId: 'sub_123' }),
      'Checkout completed',
    );
  });

  it('skips when userId is undefined', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('checkout.session.completed', {
      metadata: {},
      subscription: 'sub_123',
    });

    await handleCheckoutCompleted(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalled();
  });

  it('skips when userId is empty string', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: '' },
      subscription: 'sub_123',
    });

    await handleCheckoutCompleted(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it('skips when subscription is null', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'user_1' },
      subscription: null,
    });

    await handleCheckoutCompleted(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it('skips when subscription is undefined', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'user_1' },
    });

    await handleCheckoutCompleted(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it('skips when user does not exist in DB', async () => {
    setupUserExists(false);
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'nonexistent' },
      subscription: 'sub_123',
    });

    await handleCheckoutCompleted(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'nonexistent' }),
      'User from webhook metadata not found',
    );
  });
});

describe('handleInvoicePaid', () => {
  it('processes a valid invoice.paid event', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.paid', {
      parent: { subscription_details: { subscription: 'sub_123' } },
    });

    await handleInvoicePaid(event, stripe, log);

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        status: 'active',
        externalSubscriptionId: 'sub_123',
      }),
      expect.anything(),
    );
    expect(mockSyncRoleFromSubscription).toHaveBeenCalledWith('user_1', expect.anything());
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1' }),
      'Invoice paid',
    );
  });

  it('skips when subscription ID is undefined', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.paid', {
      parent: { subscription_details: {} },
    });

    await handleInvoicePaid(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'invoice.paid' }),
      'Missing subscription ID, skipping',
    );
  });

  it('skips when subscription ID is null', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.paid', {
      parent: { subscription_details: { subscription: null } },
    });

    await handleInvoicePaid(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it('skips when subscription ID is empty string', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.paid', {
      parent: { subscription_details: { subscription: '' } },
    });

    await handleInvoicePaid(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it('skips when parent is missing', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.paid', {});

    await handleInvoicePaid(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'invoice.paid' }),
      'Unexpected event data shape for invoice',
    );
  });

  it('skips when userId is missing from subscription metadata', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe({ metadata: {} });
    const event = makeEvent('invoice.paid', {
      parent: { subscription_details: { subscription: 'sub_123' } },
    });

    await handleInvoicePaid(event, stripe, log);

    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionId: 'sub_123', eventType: 'invoice.paid' }),
      'Webhook event missing userId in metadata and no user found by customer ID, skipping',
    );
  });

  it('skips when userId is empty string in subscription metadata', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe({ metadata: { userId: '' } });
    const event = makeEvent('invoice.paid', {
      parent: { subscription_details: { subscription: 'sub_123' } },
    });

    await handleInvoicePaid(event, stripe, log);

    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionId: 'sub_123' }),
      'Webhook event missing userId in metadata and no user found by customer ID, skipping',
    );
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it('skips when user does not exist in DB', async () => {
    setupUserExists(false);
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.paid', {
      parent: { subscription_details: { subscription: 'sub_123' } },
    });

    await handleInvoicePaid(event, stripe, log);

    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1' }),
      'User from webhook metadata not found',
    );
  });
});

describe('handleInvoicePaymentFailed', () => {
  it('processes a valid invoice.payment_failed event', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.payment_failed', {
      parent: { subscription_details: { subscription: 'sub_123' } },
    });

    await handleInvoicePaymentFailed(event, stripe, log);

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        status: 'past_due',
        externalSubscriptionId: 'sub_123',
      }),
      expect.anything(),
    );
    expect(mockSyncRoleFromSubscription).toHaveBeenCalledWith('user_1', expect.anything());
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1' }),
      'Payment failed',
    );
  });

  it('skips when subscription ID is undefined', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.payment_failed', {
      parent: { subscription_details: {} },
    });

    await handleInvoicePaymentFailed(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'invoice.payment_failed' }),
      'Missing subscription ID, skipping',
    );
  });

  it('skips when subscription ID is null', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.payment_failed', {
      parent: { subscription_details: { subscription: null } },
    });

    await handleInvoicePaymentFailed(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it('skips when subscription ID is empty string', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.payment_failed', {
      parent: { subscription_details: { subscription: '' } },
    });

    await handleInvoicePaymentFailed(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it('skips when parent is missing', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.payment_failed', {});

    await handleInvoicePaymentFailed(event, stripe, log);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'invoice.payment_failed' }),
      'Unexpected event data shape for invoice',
    );
  });

  it('skips when userId is missing from subscription metadata', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe({ metadata: {} });
    const event = makeEvent('invoice.payment_failed', {
      parent: { subscription_details: { subscription: 'sub_123' } },
    });

    await handleInvoicePaymentFailed(event, stripe, log);

    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: 'sub_123',
        eventType: 'invoice.payment_failed',
      }),
      'Webhook event missing userId in metadata and no user found by customer ID, skipping',
    );
  });

  it('skips when user does not exist in DB', async () => {
    setupUserExists(false);
    const log = createMockLogger();
    const stripe = createMockStripe();
    const event = makeEvent('invoice.payment_failed', {
      parent: { subscription_details: { subscription: 'sub_123' } },
    });

    await handleInvoicePaymentFailed(event, stripe, log);

    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1' }),
      'User from webhook metadata not found',
    );
  });
});

describe('handleSubscriptionUpdated', () => {
  it('skips when event data is missing required keys', async () => {
    const log = createMockLogger();
    const event = makeEvent('customer.subscription.updated', { status: 'active' });

    await handleSubscriptionUpdated(event, log);

    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'customer.subscription.updated' }),
      'Unexpected event data shape for subscription',
    );
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it('processes a valid subscription update', async () => {
    const log = createMockLogger();
    const sub = makeSub({ status: 'trialing' });
    const event = makeEvent('customer.subscription.updated', sub);

    await handleSubscriptionUpdated(event, log);

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        status: 'trialing',
        externalSubscriptionId: 'sub_123',
      }),
      expect.anything(),
    );
    expect(mockSyncRoleFromSubscription).toHaveBeenCalledWith('user_1', expect.anything());
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1', status: 'trialing' }),
      'Subscription updated',
    );
  });

  it('skips when userId is missing from metadata', async () => {
    const log = createMockLogger();
    const sub = makeSub({ metadata: {} });
    const event = makeEvent('customer.subscription.updated', sub);

    await handleSubscriptionUpdated(event, log);

    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: 'sub_123',
        eventType: 'customer.subscription.updated',
      }),
      'Webhook event missing userId in metadata and no user found by customer ID, skipping',
    );
  });

  it('falls back to customer ID when metadata has no userId', async () => {
    mockSelect.mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user_1' }]),
        }),
      }),
    }));

    const log = createMockLogger();
    const sub = makeSub({ metadata: {}, customer: 'cus_123' });
    const event = makeEvent('customer.subscription.updated', sub);

    await handleSubscriptionUpdated(event, log);

    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cus_123', userId: 'user_1' }),
      'Resolved userId from customer ID (metadata fallback)',
    );
    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1' }),
      expect.anything(),
    );
  });

  it('skips when userId is empty string', async () => {
    const log = createMockLogger();
    const sub = makeSub({ metadata: { userId: '' } });
    const event = makeEvent('customer.subscription.updated', sub);

    await handleSubscriptionUpdated(event, log);

    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionId: 'sub_123' }),
      'Webhook event missing userId in metadata and no user found by customer ID, skipping',
    );
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
  });

  it('skips when user does not exist in DB', async () => {
    setupUserExists(false);
    const log = createMockLogger();
    const sub = makeSub();
    const event = makeEvent('customer.subscription.updated', sub);

    await handleSubscriptionUpdated(event, log);

    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1' }),
      'User from webhook metadata not found',
    );
  });
});

describe('handleSubscriptionDeleted', () => {
  it('skips when event data is missing required keys', async () => {
    const log = createMockLogger();
    const event = makeEvent('customer.subscription.deleted', { status: 'canceled' });

    await handleSubscriptionDeleted(event, log);

    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'customer.subscription.deleted' }),
      'Unexpected event data shape for subscription',
    );
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(mockUpdateUserRole).not.toHaveBeenCalled();
  });

  it('processes a valid subscription deletion and downgrades to free', async () => {
    const log = createMockLogger();
    const sub = makeSub({ status: 'canceled' });
    const event = makeEvent('customer.subscription.deleted', sub);

    await handleSubscriptionDeleted(event, log);

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        status: 'canceled',
        externalSubscriptionId: 'sub_123',
        externalPriceId: 'price_pro',
        cancelAtPeriodEnd: false,
      }),
      expect.anything(),
    );
    expect(mockUpdateUserRole).toHaveBeenCalledWith('user_1', 'free', expect.anything());
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1' }),
      'Subscription deleted, downgraded to free',
    );
  });

  it('skips when userId is missing from metadata', async () => {
    const log = createMockLogger();
    const sub = makeSub({ metadata: {} });
    const event = makeEvent('customer.subscription.deleted', sub);

    await handleSubscriptionDeleted(event, log);

    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(mockUpdateUserRole).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalled();
  });

  it('skips when userId is empty string', async () => {
    const log = createMockLogger();
    const sub = makeSub({ metadata: { userId: '' } });
    const event = makeEvent('customer.subscription.deleted', sub);

    await handleSubscriptionDeleted(event, log);

    expect(log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionId: 'sub_123' }),
      'Webhook event missing userId in metadata and no user found by customer ID, skipping',
    );
    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(mockUpdateUserRole).not.toHaveBeenCalled();
  });

  it('skips when user does not exist in DB', async () => {
    setupUserExists(false);
    const log = createMockLogger();
    const sub = makeSub();
    const event = makeEvent('customer.subscription.deleted', sub);

    await handleSubscriptionDeleted(event, log);

    expect(mockUpsertSubscription).not.toHaveBeenCalled();
    expect(mockUpdateUserRole).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalled();
  });
});

describe('handleChargeRefunded', () => {
  it('logs the refund details', () => {
    const log = createMockLogger();
    const event = makeEvent('charge.refunded', {
      id: 'ch_123',
      amount_refunded: 2000,
    });

    handleChargeRefunded(event, log);

    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ chargeId: 'ch_123', amountRefunded: 2000 }),
      'Charge refunded - subscription status changes handled by subscription events',
    );
  });

  it('skips when event data is missing required keys', () => {
    const log = createMockLogger();
    const event = makeEvent('charge.refunded', {});

    handleChargeRefunded(event, log);

    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'charge.refunded' }),
      'Unexpected event data shape for charge',
    );
    expect(log.info).not.toHaveBeenCalled();
  });
});

describe('handleCustomerDeleted', () => {
  it('clears the paymentCustomerId from the user record', async () => {
    const log = createMockLogger();
    const event = makeEvent('customer.deleted', { id: 'cus_456' });

    await handleCustomerDeleted(event, log);

    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cus_456' }),
      'Stripe customer deleted',
    );
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('skips when event data is missing required keys', async () => {
    const log = createMockLogger();
    const event = makeEvent('customer.deleted', {});

    await handleCustomerDeleted(event, log);

    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'customer.deleted' }),
      'Unexpected event data shape for customer',
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe('getSubscriptionPeriod (via handlers)', () => {
  it('uses fallback when subscription has no items data', async () => {
    const log = createMockLogger();
    const sub = makeSub({
      items: { data: [] },
      metadata: { userId: 'user_1' },
    });
    const event = makeEvent('customer.subscription.updated', sub);

    await handleSubscriptionUpdated(event, log);

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        externalPriceId: '',
      }),
      expect.anything(),
    );
  });

  it('uses fallback dates when item lacks period fields', async () => {
    const log = createMockLogger();
    const sub = makeSub({
      items: {
        data: [
          {
            price: { id: 'price_test' },
          },
        ],
      },
      metadata: { userId: 'user_1' },
    });
    const event = makeEvent('customer.subscription.updated', sub);

    await handleSubscriptionUpdated(event, log);

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        externalPriceId: 'price_test',
        currentPeriodStart: expect.any(Date),
        currentPeriodEnd: expect.any(Date),
      }),
      expect.anything(),
    );
  });

  it('uses fallback when item price is missing', async () => {
    const log = createMockLogger();
    const sub = makeSub({
      items: {
        data: [
          {
            current_period_start: 1000000,
            current_period_end: 2000000,
          },
        ],
      },
      metadata: { userId: 'user_1' },
    });
    const event = makeEvent('customer.subscription.updated', sub);

    await handleSubscriptionUpdated(event, log);

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        externalPriceId: '',
      }),
      expect.anything(),
    );
  });
});

describe('upsertFromStripe statusOverride (via handlers)', () => {
  it('uses subscription status when statusOverride is null (checkout)', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe({ status: 'trialing' });
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'user_1' },
      subscription: 'sub_123',
    });

    await handleCheckoutCompleted(event, stripe, log);

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'trialing' }),
      expect.anything(),
    );
  });

  it('uses "active" override for invoice.paid', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe({ status: 'past_due' });
    const event = makeEvent('invoice.paid', {
      parent: { subscription_details: { subscription: 'sub_123' } },
    });

    await handleInvoicePaid(event, stripe, log);

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' }),
      expect.anything(),
    );
  });

  it('uses "past_due" override for invoice.payment_failed', async () => {
    const log = createMockLogger();
    const stripe = createMockStripe({ status: 'active' });
    const event = makeEvent('invoice.payment_failed', {
      parent: { subscription_details: { subscription: 'sub_123' } },
    });

    await handleInvoicePaymentFailed(event, stripe, log);

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'past_due' }),
      expect.anything(),
    );
  });

  it('uses subscription status for subscription.updated (no override)', async () => {
    const log = createMockLogger();
    const sub = makeSub({ status: 'incomplete' });
    const event = makeEvent('customer.subscription.updated', sub);

    await handleSubscriptionUpdated(event, log);

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'incomplete' }),
      expect.anything(),
    );
  });
});

describe('cancel_at_period_end handling', () => {
  it('passes cancel_at_period_end=true when subscription is set to cancel', async () => {
    const log = createMockLogger();
    const sub = makeSub({ cancel_at_period_end: true });
    const event = makeEvent('customer.subscription.updated', sub);

    await handleSubscriptionUpdated(event, log);

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ cancelAtPeriodEnd: true }),
      expect.anything(),
    );
  });

  it('handleSubscriptionDeleted always sets cancelAtPeriodEnd to false', async () => {
    const log = createMockLogger();
    const sub = makeSub({ cancel_at_period_end: true, status: 'canceled' });
    const event = makeEvent('customer.subscription.deleted', sub);

    await handleSubscriptionDeleted(event, log);

    expect(mockUpsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ cancelAtPeriodEnd: false }),
      expect.anything(),
    );
  });
});
