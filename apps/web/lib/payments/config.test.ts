import { describe, it, expect } from 'vitest';

import { PLANS } from '@template/shared';
import messages from '@/messages/en.json';

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
  });

  describe('plan messages alignment', () => {
    it('every plan key has a corresponding message entry', () => {
      for (const key of Object.keys(PLANS)) {
        const planMessages = messages.plans[key as keyof typeof messages.plans];
        expect(planMessages).toBeDefined();
        expect(planMessages.name).toBeTruthy();
        expect(planMessages.description).toBeTruthy();
        expect(planMessages.features.length).toBeGreaterThan(0);
      }
    });

    it('free plan message has name "Free"', () => {
      expect(messages.plans.free.name).toBe('Free');
    });

    it('pro plan message has name "Pro"', () => {
      expect(messages.plans.pro.name).toBe('Pro');
    });

    it('pro plan has at least as many features as free plan', () => {
      expect(messages.plans.pro.features.length).toBeGreaterThanOrEqual(
        messages.plans.free.features.length,
      );
    });
  });
});
