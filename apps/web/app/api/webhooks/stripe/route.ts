import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

import { getStripe } from '@/lib/payments/stripe';
import { createErrorResponse, ClientError, ServerError } from '@/lib/errors';
import { createRequestLogger, withCorrelation } from '@/lib/logger';
import { createRateLimiter, RATE_LIMITS } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/client-ip';
import { env } from '@/lib/env';
import { db } from '@/lib/db';
import { webhookEvent } from '@/lib/db/schema/webhook-events';

import {
  handleCheckoutCompleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleChargeRefunded,
  handleCustomerDeleted,
} from './handlers';

export const dynamic = 'force-dynamic';

async function applyRateLimit(request: Request): Promise<NextResponse | null> {
  const ip = getClientIp(request.headers);
  try {
    const limiter = await createRateLimiter(RATE_LIMITS.webhook);
    const result = await limiter.check(ip);
    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            blame: 'client' as const,
            statusCode: 429,
          },
        },
        { status: 429 },
      );
    }
  } catch {
    // Rate limiter failure should not block webhook processing
  }
  return null;
}

function verifySignature(body: string, signature: string, stripe: Stripe): Stripe.Event {
  if (env.STRIPE_WEBHOOK_SECRET === undefined || env.STRIPE_WEBHOOK_SECRET === '') {
    throw new ServerError('Stripe webhook secret not configured');
  }
  return stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
}

async function claimIdempotency(event: Stripe.Event): Promise<boolean> {
  const claimed = await db
    .insert(webhookEvent)
    .values({
      id: event.id,
      eventType: event.type,
      payload: JSON.stringify(event.data.object),
    })
    .onConflictDoNothing()
    .returning();
  return claimed.length > 0;
}

async function shouldProcessEvent(
  event: Stripe.Event,
  isClaimed: boolean,
  log: ReturnType<typeof createRequestLogger>['logger'],
): Promise<boolean> {
  if (isClaimed) {
    return true;
  }

  const existing = await db
    .select({ status: webhookEvent.status })
    .from(webhookEvent)
    .where(eq(webhookEvent.id, event.id))
    .limit(1);

  if (existing[0]?.status === 'failed') {
    log.info({ eventId: event.id }, 'Retrying previously failed webhook event');
    return true;
  }

  log.info({ eventId: event.id }, 'Duplicate webhook event, skipping');
  return false;
}

async function recordFailure(
  event: Stripe.Event,
  err: unknown,
  log: ReturnType<typeof createRequestLogger>['logger'],
): Promise<void> {
  log.error({ err, eventType: event.type, eventId: event.id }, 'Error processing webhook');
  await db
    .update(webhookEvent)
    .set({
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
    })
    .where(eq(webhookEvent.id, event.id))
    .catch((updateErr) => log.error({ updateErr }, 'Failed to update webhook event status'));
}

async function dispatchEvent(
  event: Stripe.Event,
  stripe: Stripe,
  log: ReturnType<typeof createRequestLogger>['logger'],
) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event, stripe, log);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event, stripe, log);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event, stripe, log);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event, log);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event, log);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event, log);
      break;
    case 'customer.deleted':
      await handleCustomerDeleted(event, log);
      break;
    default:
      log.debug({ type: event.type }, 'Unhandled event type');
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const { logger: log } = createRequestLogger(requestId);

  return withCorrelation(requestId, async () => {
    const rateLimitResponse = await applyRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (signature === null || signature === '') {
      return createErrorResponse(new ClientError('Missing Stripe signature'));
    }

    const stripe = getStripe();
    let event: Stripe.Event;

    try {
      event = verifySignature(body, signature, stripe);
    } catch (err) {
      log.error({ err }, 'Webhook signature verification failed');
      return createErrorResponse(new ClientError('Invalid webhook signature'));
    }

    const isClaimed = await claimIdempotency(event);
    if (!(await shouldProcessEvent(event, isClaimed, log))) {
      return NextResponse.json({ received: true });
    }

    try {
      await dispatchEvent(event, stripe, log);
    } catch (err) {
      await recordFailure(event, err, log);
      return NextResponse.json(
        {
          error: {
            code: 'WEBHOOK_PROCESSING_FAILED',
            message: 'Event processing failed',
            blame: 'server' as const,
            statusCode: 500,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ received: true });
  });
}
