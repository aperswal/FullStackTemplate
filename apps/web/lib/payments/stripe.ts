import Stripe from 'stripe';

import { env } from '@/lib/env';
import { ServerError } from '@/lib/errors';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = env.STRIPE_SECRET_KEY;
    if (key === undefined || key === '') {
      throw new ServerError('STRIPE_SECRET_KEY is required');
    }
    stripeInstance = new Stripe(key, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    });
  }
  return stripeInstance;
}
