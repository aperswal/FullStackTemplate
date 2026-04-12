'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/server';
import { getStripe } from './stripe';
import { updateUserPaymentCustomerId } from './queries';

export async function createCheckoutSession(priceId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');

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
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
    metadata: { userId: user.id },
  });

  if (checkoutSession.url) {
    redirect(checkoutSession.url);
  }
}

export async function createPortalSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');

  const stripe = getStripe();
  const customerId = session.user.paymentCustomerId as string | null;

  if (!customerId) throw new Error('No payment customer found');

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  redirect(portalSession.url);
}
