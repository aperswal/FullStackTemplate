import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('home page loads and shows hero CTA', async ({ page }) => {
    await page.goto('/');
    const mainContent = page.locator('#main-content');
    await expect(mainContent.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(mainContent.getByRole('link', { name: /^Get started$/ })).toBeVisible();
  });

  test('can navigate from home to pricing', async ({ page }) => {
    await page.goto('/');
    const pricingLink = page.getByLabel('Main navigation').getByRole('link', { name: 'Pricing' });
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByRole('heading', { level: 1, name: 'Pricing' })).toBeVisible();
  });

  test('can navigate from home to login', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.getByLabel('Main navigation').getByRole('link', { name: 'Log in' });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
