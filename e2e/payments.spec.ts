import { test, expect } from './fixtures';

test.describe('Payments', () => {
  test('pricing page renders plan cards', async ({ page }) => {
    await page.goto('/pricing');
    const freeCard = page.getByRole('article', { name: 'Free' });
    const proCard = page.getByRole('article', { name: 'Pro' });

    await expect(page.getByRole('heading', { level: 1, name: 'Pricing' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(2);
    await expect(freeCard).toContainText('$0');
    await expect(proCard).toContainText('$29');
  });

  test('pricing page has a pro plan CTA', async ({ page }) => {
    await page.goto('/pricing');
    const proCard = page.getByRole('article', { name: 'Pro' });

    if ((process.env.STRIPE_PRO_PRICE_ID ?? '') !== '') {
      await expect(proCard.getByRole('button', { name: /subscribe to pro/i })).toBeVisible();
      return;
    }

    await expect(proCard.getByRole('link', { name: /get started free/i })).toBeVisible();
  });

  test('pricing page has free signup link', async ({ page }) => {
    await page.goto('/pricing');
    const freeCard = page.getByRole('article', { name: 'Free' });
    await expect(freeCard.getByRole('link', { name: /get started free/i })).toBeVisible();
  });
});
