/** Plan configuration — the single source of truth for pricing tiers. */

import type { UserRole } from './roles';

export interface PlanConfig {
  externalPriceId: string | null;
  role: UserRole;
  price: number;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    externalPriceId: null,
    role: 'free',
    price: 0,
  },
  pro: {
    externalPriceId: process.env.STRIPE_PRO_PRICE_ID ?? 'price_placeholder',
    role: 'pro',
    price: 29,
  },
};
