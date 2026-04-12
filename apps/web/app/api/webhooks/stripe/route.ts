import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

import { getStripe } from '@/lib/payments/stripe';
import { upsertSubscription, updateUserRole } from '@/lib/payments/queries';
import { syncRoleFromSubscription } from '@/lib/payments/entitlements';
import { createErrorResponse, ClientError, ServerError } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
import { env } from '@/lib/env';
import { db } from '@/lib/db';
import { webhookEvent } from '@/lib/db/schema/webhook-events';

export const dynamic = 'force-dynamic';

const log = createLogger('stripe-webhook');

function getSubscriptionPeriod(sub: Stripe.Subscription) {
  const item = sub.items.data[0] ?? null;
  if (!item) {
    log.warn({ subscriptionId: sub.id }, 'Subscription has no items, using fallback period');
  }
  return {
    priceId: item?.price?.id ?? '',
    currentPeriodStart: new Date(
      (item?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000,
    ),
    currentPeriodEnd: new Date(
      (item?.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 86400) * 1000,
    ),
  };
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return createErrorResponse(new ClientError('Missing Stripe signature'));
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    log.error({ err }, 'Webhook signature verification failed');
    return createErrorResponse(new ClientError('Invalid webhook signature'));
  }

  // Idempotency: skip already-processed events
  const existing = await db.query.webhookEvent.findFirst({
    where: eq(webhookEvent.id, event.id),
  });

  if (existing) {
    log.info({ eventId: event.id }, 'Duplicate webhook event, skipping');
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId || !session.subscription) {
          log.warn(
            { eventType: event.type },
            'Webhook event missing userId or subscription in metadata, skipping',
          );
          break;
        }

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const period = getSubscriptionPeriod(sub);
        await db.transaction(async (tx) => {
          await upsertSubscription(
            {
              id: crypto.randomUUID(),
              userId,
              provider: 'stripe',
              externalSubscriptionId: sub.id,
              externalPriceId: period.priceId,
              status: sub.status as 'active' | 'canceled' | 'past_due' | 'trialing',
              currentPeriodStart: period.currentPeriodStart,
              currentPeriodEnd: period.currentPeriodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
            tx,
          );
          await syncRoleFromSubscription(userId, tx);
        });
        log.info({ userId, subscriptionId: sub.id }, 'Checkout completed');
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.parent?.subscription_details?.subscription;
        if (!subId) {
          log.warn({ eventType: event.type }, 'Webhook event missing subscription ID, skipping');
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subId as string);
        const userId = sub.metadata?.userId;
        if (!userId) {
          log.warn(
            { subscriptionId: sub.id, eventType: event.type },
            'Webhook event missing userId in metadata, skipping',
          );
          break;
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
              status: 'active',
              currentPeriodStart: period.currentPeriodStart,
              currentPeriodEnd: period.currentPeriodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
            tx,
          );
          await syncRoleFromSubscription(userId, tx);
        });
        log.info({ userId }, 'Invoice paid');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const failedSubId = invoice.parent?.subscription_details?.subscription;
        if (!failedSubId) {
          log.warn({ eventType: event.type }, 'Webhook event missing subscription ID, skipping');
          break;
        }

        const sub = await stripe.subscriptions.retrieve(failedSubId as string);
        const userId = sub.metadata?.userId;
        if (!userId) {
          log.warn(
            { subscriptionId: sub.id, eventType: event.type },
            'Webhook event missing userId in metadata, skipping',
          );
          break;
        }

        const period = getSubscriptionPeriod(sub);
        await upsertSubscription({
          id: crypto.randomUUID(),
          userId,
          provider: 'stripe',
          externalSubscriptionId: sub.id,
          externalPriceId: period.priceId,
          status: 'past_due',
          currentPeriodStart: period.currentPeriodStart,
          currentPeriodEnd: period.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        });
        log.warn({ userId }, 'Payment failed');
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) {
          log.warn(
            { subscriptionId: sub.id, eventType: event.type },
            'Webhook event missing userId in metadata, skipping',
          );
          break;
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
              status: sub.status as 'active' | 'canceled' | 'past_due' | 'trialing',
              currentPeriodStart: period.currentPeriodStart,
              currentPeriodEnd: period.currentPeriodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
            tx,
          );
          await syncRoleFromSubscription(userId, tx);
        });
        log.info({ userId, status: sub.status }, 'Subscription updated');
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) {
          log.warn(
            { subscriptionId: sub.id, eventType: event.type },
            'Webhook event missing userId in metadata, skipping',
          );
          break;
        }

        await updateUserRole(userId, 'free');
        log.info({ userId }, 'Subscription deleted, downgraded to free');
        break;
      }

      default:
        log.debug({ type: event.type }, 'Unhandled event type');
    }

    // Record processed event for idempotency
    await db.insert(webhookEvent).values({ id: event.id });
  } catch (err) {
    log.error({ err, eventType: event.type }, 'Error processing webhook');
    return createErrorResponse(new ServerError('Webhook processing failed'));
  }

  return NextResponse.json({ received: true });
}
