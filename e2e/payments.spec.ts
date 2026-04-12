import { test, expect } from '@playwright/test';

test.describe('Payments', () => {
  test('pricing page renders plan cards', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText('Pricing')).toBeVisible();
    await expect(page.getByText('Free')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('$0')).toBeVisible();
    await expect(page.getByText('$29')).toBeVisible();
  });

  test('pricing page has checkout button for pro plan', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('button', { name: /subscribe to pro/i })).toBeVisible();
  });

  test('pricing page has free signup link', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('link', { name: /get started free/i })).toBeVisible();
  });
});
