'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { withServerAction } from '@/lib/api/with-server-action';
import { ClientError } from '@/lib/errors';
import { env } from '@/lib/env';
import { db } from '@/lib/db';
import { user as userTable } from '@/lib/db/schema/auth';
import { ROUTES } from '@/lib/routes';
import { getStripe } from './stripe';
import { updateUserPaymentCustomerId } from './queries';

const IDEMPOTENCY_WINDOW_MS = 60000;

export const createCheckoutSession = withServerAction(
  'createCheckoutSession',
  async (priceId: string, { session }) => {
    const stripe = getStripe();

    const customerId = await db.transaction(async (tx) => {
      const [currentUser] = await tx
        .select({ paymentCustomerId: userTable.paymentCustomerId })
        .from(userTable)
        .where(eq(userTable.id, session.user.id))
        .for('update');

      if (
        currentUser?.paymentCustomerId !== undefined &&
        currentUser.paymentCustomerId !== null &&
        currentUser.paymentCustomerId !== ''
      ) {
        return currentUser.paymentCustomerId;
      }

      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
        metadata: { userId: session.user.id },
      });

      await updateUserPaymentCustomerId(session.user.id, customer.id, 'stripe', tx);
      return customer.id;
    });

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.dashboard}?checkout=success`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.pricing}?checkout=canceled`,
        metadata: { userId: session.user.id },
      },
      {
        idempotencyKey: `checkout:${session.user.id}:${priceId}:${Math.floor(Date.now() / IDEMPOTENCY_WINDOW_MS)}`,
      },
    );

    if (checkoutSession.url !== null && checkoutSession.url !== '') {
      redirect(checkoutSession.url);
    }
  },
);

export const createPortalSession = withServerAction(
  'createPortalSession',
  async (_input: undefined, { session }) => {
    const stripe = getStripe();
    const customerId = session.user.paymentCustomerId as string | null;

    if (customerId === null || customerId === '') {
      throw new ClientError('No payment customer found', { statusCode: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.dashboard}`,
    });

    redirect(portalSession.url);
  },
);
