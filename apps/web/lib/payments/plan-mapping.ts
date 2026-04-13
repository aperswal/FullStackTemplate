/** Maps plan keys to Stripe price IDs using validated environment variables. */

import { env } from '@/lib/env';
import { PLANS } from '@template/shared';
import type { UserRole } from '@template/shared';

const PRICE_ID_TO_PLAN: Record<string, string> = {};

function buildPriceMapping(): void {
  if (env.STRIPE_PRO_PRICE_ID !== undefined && env.STRIPE_PRO_PRICE_ID !== '') {
    PRICE_ID_TO_PLAN[env.STRIPE_PRO_PRICE_ID] = 'pro';
  }
}

// Initialize eagerly on module load
buildPriceMapping();

export function getPriceIdForPlan(planKey: string): string | null {
  if (planKey === 'pro') {
    return env.STRIPE_PRO_PRICE_ID ?? null;
  }
  return null;
}

export function getRoleForPriceId(priceId: string): UserRole | null {
  const planKey = PRICE_ID_TO_PLAN[priceId];
  if (planKey === undefined || planKey === '') {
    return null;
  }

  return PLANS[planKey]?.role ?? null;
}
