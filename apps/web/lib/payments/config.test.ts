import { describe, it, expect } from 'vitest';

import { PLANS } from '@template/shared';

describe('PLANS', () => {
  it('has free and pro plans', () => {
    expect(Object.keys(PLANS)).toEqual(['free', 'pro']);
  });

  describe('free plan', () => {
    it('has price 0', () => {
      expect(PLANS.free.price).toBe(0);
    });

    it('has role "free"', () => {
      expect(PLANS.free.role).toBe('free');
    });

    it('has null externalPriceId', () => {
      expect(PLANS.free.externalPriceId).toBe(null);
    });

    it('has name "Free"', () => {
      expect(PLANS.free.name).toBe('Free');
    });

    it('has a non-empty features array', () => {
      expect(PLANS.free.features.length).toBeGreaterThan(0);
    });

    it('includes "1 project" in features', () => {
      expect(PLANS.free.features).toContain('1 project');
    });
  });

  describe('pro plan', () => {
    it('has price 29', () => {
      expect(PLANS.pro.price).toBe(29);
    });

    it('has role "pro"', () => {
      expect(PLANS.pro.role).toBe('pro');
    });

    it('has an externalPriceId string', () => {
      expect(typeof PLANS.pro.externalPriceId).toBe('string');
    });

    it('has name "Pro"', () => {
      expect(PLANS.pro.name).toBe('Pro');
    });

    it('has at least as many features as free plan', () => {
      expect(PLANS.pro.features.length).toBeGreaterThanOrEqual(PLANS.free.features.length);
    });

    it('includes "Unlimited projects" in features', () => {
      expect(PLANS.pro.features).toContain('Unlimited projects');
    });
  });
});
