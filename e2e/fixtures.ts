import { expect, test as base } from '@playwright/test';

const COOKIE_CONSENT_KEY = 'cookie-consent';

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript((key: string) => {
      window.localStorage.setItem(key, JSON.stringify({ analytics: false, necessary: true }));
    }, COOKIE_CONSENT_KEY);

    await use(context);
  },
});

export { expect };
