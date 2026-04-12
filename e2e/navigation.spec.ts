import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page loads and shows hero CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started|sign up/i })).toBeVisible();
  });

  test('can navigate from home to pricing', async ({ page }) => {
    await page.goto('/');
    const pricingLink = page.getByRole('link', { name: /pricing/i }).first();
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByText('Pricing')).toBeVisible();
  });

  test('can navigate from home to login', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.getByRole('link', { name: /sign in|log in/i }).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('healthy');
  });
});
