/** Subscription status and payment provider definitions. */

export const SUBSCRIPTION_STATUSES = [
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type PaymentProviderName = 'stripe' | 'lemon_squeezy' | 'paddle' | 'none';
