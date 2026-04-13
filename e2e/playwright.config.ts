import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? '50%' : undefined,
  reporter: CI ? [['junit', { outputFile: 'results.xml' }], ['html']] : 'html',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: CI ? 'pnpm --filter @template/web start' : 'pnpm --filter @template/web dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !CI,
    cwd: '..',
  },
});
