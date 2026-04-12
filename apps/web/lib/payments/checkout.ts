'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/server';
import { ClientError } from '@/lib/errors';
import { ROUTES } from '@/lib/routes';
import { getStripe } from './stripe';
import { updateUserPaymentCustomerId } from './queries';

export async function createCheckoutSession(priceId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new ClientError('Not authenticated', { statusCode: 401 });

  const stripe = getStripe();
  const { user } = session;

  let customerId = user.paymentCustomerId as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await updateUserPaymentCustomerId(user.id, customerId);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.dashboard}?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.pricing}?checkout=canceled`,
    metadata: { userId: user.id },
  });

  if (checkoutSession.url) {
    redirect(checkoutSession.url);
  }
}

export async function createPortalSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new ClientError('Not authenticated', { statusCode: 401 });

  const stripe = getStripe();
  const customerId = session.user.paymentCustomerId as string | null;

  if (!customerId) throw new ClientError('No payment customer found', { statusCode: 404 });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.dashboard}`,
  });

  redirect(portalSession.url);
}
