# End-to-End Tests

This package owns Playwright tests for full user workflows. Read `CLAUDE FILES/ux.md` for user flows and `CLAUDE FILES/security.md` when tests cover auth, payments, webhooks, or protected routes.

Test behavior through the browser the way a user experiences it. Prefer accessible locators and visible text over brittle CSS selectors or implementation details.

Keep tests independent and repeatable. Each test should create or reset the data it needs and should not depend on run order.

Use fixtures for shared setup, authenticated sessions, and test data. Do not store real credentials, payment secrets, or production URLs in test code.

Run with `pnpm test:e2e` from the root or `pnpm --filter @template/e2e test` when the app dependencies are already running.
