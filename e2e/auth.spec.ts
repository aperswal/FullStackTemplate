import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  test('redirects unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    const mainContent = page.getByRole('main');
    await expect(
      mainContent.getByRole('heading', { level: 1, name: 'Welcome back' }),
    ).toBeVisible();
    await expect(mainContent.getByLabel('Email')).toBeVisible();
    await expect(mainContent.getByLabel('Password')).toBeVisible();
    await expect(mainContent.getByRole('button', { name: /^Sign in$/ })).toBeVisible();
  });

  test('signup page renders correctly', async ({ page }) => {
    await page.goto('/signup');
    const mainContent = page.getByRole('main');
    await expect(
      mainContent.getByRole('heading', { level: 1, name: 'Create an account' }),
    ).toBeVisible();
    await expect(mainContent.getByLabel('Name')).toBeVisible();
    await expect(mainContent.getByLabel('Email')).toBeVisible();
  });

  test('login page has link to signup', async ({ page }) => {
    await page.goto('/login');
    const signupLink = page.getByRole('main').getByRole('link', { name: /sign up/i });
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('signup page has link to login', async ({ page }) => {
    await page.goto('/signup');
    const loginLink = page.getByRole('main').getByRole('link', { name: /sign in/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
