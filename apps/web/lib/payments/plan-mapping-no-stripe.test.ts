import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_PRO_PRICE_ID: undefined,
  },
}));

import { getPriceIdForPlan, getRoleForPriceId } from './plan-mapping';

describe('plan-mapping without STRIPE_PRO_PRICE_ID', () => {
  it('getPriceIdForPlan returns null for pro when no price ID configured', () => {
    expect(getPriceIdForPlan('pro')).toBeNull();
  });

  it('getRoleForPriceId returns null for any price when mapping is empty', () => {
    expect(getRoleForPriceId('price_anything')).toBeNull();
  });
});
