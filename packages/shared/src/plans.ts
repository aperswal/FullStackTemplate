/** Plan configuration — the single source of truth for pricing tiers and features. */

import type { UserRole } from './roles';

export interface PlanConfig {
  name: string;
  description: string;
  externalPriceId: string | null;
  role: UserRole;
  price: number;
  features: string[];
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    name: 'Free',
    description: 'For individuals getting started',
    externalPriceId: null,
    role: 'free',
    price: 0,
    features: ['Basic features', 'Community support', '1 project'],
  },
  pro: {
    name: 'Pro',
    description: 'For professionals and teams',
    externalPriceId: process.env.STRIPE_PRO_PRICE_ID ?? 'price_placeholder',
    role: 'pro',
    price: 29,
    features: [
      'All free features',
      'Priority support',
      'Unlimited projects',
      // TODO: Add back when implemented:
      // 'API access'
      // 'Advanced analytics'
      // 'Data export'
    ],
  },
};
