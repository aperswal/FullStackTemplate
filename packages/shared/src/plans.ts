/** Plan configuration - the single source of truth for pricing tiers. */

import type { UserRole } from './roles';

export interface PlanConfig {
  role: UserRole;
  price: number;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    role: 'free',
    price: 0,
  },
  pro: {
    role: 'pro',
    price: 29,
  },
};
