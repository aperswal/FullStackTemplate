import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import type { SubscriptionStatus } from '@template/shared';
import type { Logger } from 'pino';

import { upsertSubscription, updateUserRole } from '@/lib/payments/queries';
import { syncRoleFromSubscription } from '@/lib/payments/entitlements';
import { db } from '@/lib/db';
import { user as userTable } from '@/lib/db/schema/auth';
import { createLogger } from '@/lib/logger';

const MS_PER_SECOND = 1000;
const SECONDS_PER_DAY = 86400;
const DEFAULT_PERIOD_DAYS = 30;

const revenueLog = createLogger('revenue');

function hasRequiredKeys(data: unknown, keys: string[]): data is Record<string, unknown> {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  return keys.every((key) => key in data);
}

function getSubscriptionPeriod(sub: Stripe.Subscription) {
  const item = sub.items.data[0] ?? null;
  return {
    priceId: item?.price?.id ?? '',
    currentPeriodStart: new Date(
      (item?.current_period_start ?? Math.floor(Date.now() / MS_PER_SECOND)) * MS_PER_SECOND,
    ),
    currentPeriodEnd: new Date(
      (item?.current_period_end ??
        Math.floor(Date.now() / MS_PER_SECOND) + DEFAULT_PERIOD_DAYS * SECONDS_PER_DAY) *
        MS_PER_SECOND,
    ),
  };
}

async function userExists(userId: string): Promise<boolean> {
  const result = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return result.length > 0;
}

async function upsertFromStripe(
  userId: string,
  sub: Stripe.Subscription,
  statusOverride: SubscriptionStatus | null,
) {
  const period = getSubscriptionPeriod(sub);
  await db.transaction(async (tx) => {
    await upsertSubscription(
      {
        id: crypto.randomUUID(),
        userId,
        provider: 'stripe',
        externalSubscriptionId: sub.id,
        externalPriceId: period.priceId,
        status: statusOverride ?? (sub.status as SubscriptionStatus),
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
      tx,
    );
    await syncRoleFromSubscription(userId, tx);
  });
}

async function extractUserIdFromSubscription(
  sub: Stripe.Subscription,
  eventType: string,
  log: Logger,
): Promise<string | null> {
  const userId = sub.metadata?.userId;
  if (userId !== undefined && userId !== '') {
    return userId;
  }

  // Fallback: look up user by Stripe customer ID
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  if (customerId !== undefined && customerId !== '') {
    const [matchedUser] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.paymentCustomerId, customerId))
      .limit(1);
    if (matchedUser !== undefined) {
      log.info(
        { customerId, userId: matchedUser.id, eventType },
        'Resolved userId from customer ID (metadata fallback)',
      );
      return matchedUser.id;
    }
  }

  log.warn(
    { subscriptionId: sub.id, eventType },
    'Webhook event missing userId in metadata and no user found by customer ID, skipping',
  );
  return null;
}

async function validateUser(userId: string, eventType: string, log: Logger): Promise<boolean> {
  if (!(await userExists(userId))) {
    log.error({ userId, eventType }, 'User from webhook metadata not found');
    return false;
  }
  return true;
}

export async function handleCheckoutCompleted(
  event: Stripe.Event,
  stripe: Stripe,
  log: Logger,
): Promise<void> {
  if (!hasRequiredKeys(event.data.object, ['metadata'])) {
    log.error({ eventType: event.type }, 'Unexpected event data shape for checkout session');
    return;
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  if (
    userId === undefined ||
    userId === '' ||
    session.subscription === null ||
    session.subscription === undefined
  ) {
    log.warn({ eventType: event.type }, 'Missing userId or subscription in metadata, skipping');
    return;
  }

  if (!(await validateUser(userId, event.type, log))) {
    return;
  }

  const sub = await stripe.subscriptions.retrieve(session.subscription as string);
  await upsertFromStripe(userId, sub, null);
  revenueLog.info(
    { userId, subscriptionId: sub.id, eventType: event.type },
    'Checkout revenue tracked',
  );
  log.info({ userId, subscriptionId: sub.id }, 'Checkout completed');
}

export async function handleInvoicePaid(
  event: Stripe.Event,
  stripe: Stripe,
  log: Logger,
): Promise<void> {
  if (!hasRequiredKeys(event.data.object, ['parent'])) {
    log.error({ eventType: event.type }, 'Unexpected event data shape for invoice');
    return;
  }
  const invoice = event.data.object as Stripe.Invoice;
  const subId = invoice.parent?.subscription_details?.subscription;
  if (subId === undefined || subId === null || subId === '') {
    log.warn({ eventType: event.type }, 'Missing subscription ID, skipping');
    return;
  }

  const sub = await stripe.subscriptions.retrieve(subId as string);
  const userId = await extractUserIdFromSubscription(sub, event.type, log);
  if (userId === null || !(await validateUser(userId, event.type, log))) {
    return;
  }

  await upsertFromStripe(userId, sub, 'active');
  revenueLog.info(
    {
      userId,
      subscriptionId: sub.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      eventType: event.type,
    },
    'Invoice revenue tracked',
  );
  log.info({ userId }, 'Invoice paid');
}

export async function handleInvoicePaymentFailed(
  event: Stripe.Event,
  stripe: Stripe,
  log: Logger,
): Promise<void> {
  if (!hasRequiredKeys(event.data.object, ['parent'])) {
    log.error({ eventType: event.type }, 'Unexpected event data shape for invoice');
    return;
  }
  const invoice = event.data.object as Stripe.Invoice;
  const failedSubId = invoice.parent?.subscription_details?.subscription;
  if (failedSubId === undefined || failedSubId === null || failedSubId === '') {
    log.warn({ eventType: event.type }, 'Missing subscription ID, skipping');
    return;
  }

  const sub = await stripe.subscriptions.retrieve(failedSubId as string);
  const userId = await extractUserIdFromSubscription(sub, event.type, log);
  if (userId === null || !(await validateUser(userId, event.type, log))) {
    return;
  }

  await upsertFromStripe(userId, sub, 'past_due');
  log.warn({ userId }, 'Payment failed');
}

export async function handleSubscriptionUpdated(event: Stripe.Event, log: Logger): Promise<void> {
  if (!hasRequiredKeys(event.data.object, ['metadata', 'items'])) {
    log.error({ eventType: event.type }, 'Unexpected event data shape for subscription');
    return;
  }
  const sub = event.data.object as Stripe.Subscription;
  const userId = await extractUserIdFromSubscription(sub, event.type, log);
  if (userId === null || !(await validateUser(userId, event.type, log))) {
    return;
  }

  await upsertFromStripe(userId, sub, null);
  log.info({ userId, status: sub.status }, 'Subscription updated');
}

export async function handleSubscriptionDeleted(event: Stripe.Event, log: Logger): Promise<void> {
  if (!hasRequiredKeys(event.data.object, ['metadata', 'items'])) {
    log.error({ eventType: event.type }, 'Unexpected event data shape for subscription');
    return;
  }
  const sub = event.data.object as Stripe.Subscription;
  const userId = await extractUserIdFromSubscription(sub, event.type, log);
  if (userId === null || !(await validateUser(userId, event.type, log))) {
    return;
  }

  const period = getSubscriptionPeriod(sub);
  await db.transaction(async (tx) => {
    await upsertSubscription(
      {
        id: crypto.randomUUID(),
        userId,
        provider: 'stripe',
        externalSubscriptionId: sub.id,
        externalPriceId: period.priceId,
        status: 'canceled',
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
      tx,
    );
    await updateUserRole(userId, 'free', tx);
  });
  log.info({ userId }, 'Subscription deleted, downgraded to free');
}

export function handleChargeRefunded(event: Stripe.Event, log: Logger): void {
  if (!hasRequiredKeys(event.data.object, ['id', 'amount_refunded'])) {
    log.error({ eventType: event.type }, 'Unexpected event data shape for charge');
    return;
  }
  const charge = event.data.object as Stripe.Charge;
  log.info(
    { chargeId: charge.id, amountRefunded: charge.amount_refunded },
    'Charge refunded — subscription status changes handled by subscription events',
  );
}

export async function handleCustomerDeleted(event: Stripe.Event, log: Logger): Promise<void> {
  if (!hasRequiredKeys(event.data.object, ['id'])) {
    log.error({ eventType: event.type }, 'Unexpected event data shape for customer');
    return;
  }
  const customer = event.data.object as Stripe.Customer;
  log.info({ customerId: customer.id }, 'Stripe customer deleted');
  await db
    .update(userTable)
    .set({ paymentCustomerId: null, updatedAt: new Date() })
    .where(eq(userTable.paymentCustomerId, customer.id));
}
