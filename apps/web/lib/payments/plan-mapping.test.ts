import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_PRO_PRICE_ID: 'price_pro_123',
  },
}));

import { getPriceIdForPlan, getRoleForPriceId } from './plan-mapping';

describe('getPriceIdForPlan', () => {
  it('returns the price ID for the pro plan', () => {
    expect(getPriceIdForPlan('pro')).toBe('price_pro_123');
  });

  it('returns null for the free plan', () => {
    expect(getPriceIdForPlan('free')).toBeNull();
  });

  it('returns null for an unknown plan key', () => {
    expect(getPriceIdForPlan('enterprise')).toBeNull();
  });
});

describe('getRoleForPriceId', () => {
  it('returns the role for a known price ID', () => {
    const role = getRoleForPriceId('price_pro_123');
    expect(role).toBe('pro');
  });

  it('returns null for an unknown price ID', () => {
    expect(getRoleForPriceId('price_unknown')).toBeNull();
  });
});
