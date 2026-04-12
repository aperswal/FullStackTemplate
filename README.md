# Full-Stack Template

Production-ready monorepo template with Next.js, Go, and Python. Switch between SaaS deployment (Vercel) and self-hosted (Docker) with one environment variable.

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker & Docker Compose
- Go 1.24+ (for worker service)
- Python 3.12+ (for data/AI service)

## Quick Start

### Automated Setup

```bash
./scripts/setup.sh
```

The interactive setup wizard walks through every service — prerequisites, database, Stripe, OAuth, email, analytics, translation, and more. It is resumable: if you stop midway, re-running picks up where you left off.

### Manual Setup

```bash
cp .env.example .env              # configure environment variables
pnpm install                       # install Node.js dependencies
docker compose up -d db mailpit    # start Postgres + Mailpit
cd apps/web && pnpm db:migrate     # run database migrations
cd ../.. && pnpm dev               # start dev server
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

```
apps/web/              Next.js 15 (App Router) — UI, API routes, auth, payments
packages/shared/       Shared types, constants, interfaces (single source of truth)
services/worker/       Go worker — background jobs, DB heartbeat
services/python/       Python service — data analysis, AI/ML, notebooks
infra/cdk/             AWS CDK stacks — S3 storage, CloudWatch monitoring
e2e/                   Playwright end-to-end tests
scripts/               Interactive setup wizard, translation automation
```

## Deploy Mode

Set `DEPLOY_TARGET` in `.env` to control behavior across the stack:

| Concern        | `docker` (self-hosted) | `vercel` (SaaS) |
| -------------- | ---------------------- | --------------- |
| Email provider | SMTP (Mailpit in dev)  | Resend          |
| Next.js output | `standalone`           | default         |
| Hosting        | Docker Compose         | Vercel          |
| Analytics      | Opt-in via PostHog key | PostHog         |

## What's Included

### Authentication

BetterAuth with email/password, optional Google and GitHub OAuth, email verification, password reset, and session caching. OAuth providers are gracefully disabled when keys are not set.

- Middleware-based route protection with security headers (HSTS, X-Frame-Options, CSP, Referrer-Policy)
- Open redirect prevention on login callback URLs
- Row-level ownership guards via `withOwnership()` Drizzle filter

### Payments

Stripe integration with the full subscription lifecycle:

- Checkout session creation with customer ID management
- Webhook handler for `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Webhook idempotency via `webhook_event` table — duplicate events are detected and skipped
- Transactional consistency — subscription upsert and role sync wrapped in `db.transaction()`
- Role-based entitlements enforced at the data layer (`getUserEntitlements`, `requireEntitlement`)
- Plans configured in `packages/shared/src/plans.ts` (technical fields) and `messages/en.json` (display strings)

### Database

PostgreSQL 16 with Drizzle ORM:

- Schema: `user`, `session`, `account`, `verification`, `subscription`, `webhook_event`
- Type-safe queries with schema-derived TypeScript types
- Migration tooling via `drizzle-kit` (generate, migrate, push, studio)
- Seed script for development data

```bash
pnpm db:generate    # generate migration from schema changes
pnpm db:migrate     # apply pending migrations
pnpm db:push        # push schema directly (dev only)
pnpm db:studio      # open Drizzle Studio GUI
pnpm db:seed        # seed development data
```

### Email

Abstracted provider pattern — Resend for SaaS mode, SMTP for Docker mode. Provider selection is automatic based on `DEPLOY_TARGET`.

Templates built with React Email:

- Email verification
- Password reset
- Payment receipt
- Subscription warning (failed payment)

In development, Mailpit captures all emails at [http://localhost:8025](http://localhost:8025).

### Internationalization (i18n)

All user-facing strings go through `next-intl`. ESLint enforces this at build time — hardcoded strings in `.tsx` files cause lint failure.

- Messages stored in `apps/web/messages/en.json`, organized by namespace
- Server components use `getTranslations()`, client components use `useTranslations()`
- Email templates, Zod validation, SEO metadata, and manifest all reference the message file

#### Adding Languages

1. Edit `apps/web/i18n.config.json` — add target locales:
   ```json
   { "targetLocales": ["es", "fr", "de", "ja"] }
   ```
2. Run `pnpm translate` to auto-translate from English
3. Review and manually correct any translations that need it

The `translate` script uses `i18n-auto-translation` with Google Cloud Translation (free 500K chars/month) or DeepL. Only new/changed keys are translated on re-runs — manual edits are preserved.

```bash
pnpm translate                       # all configured locales
pnpm translate --to es,fr            # specific locales only
pnpm translate --override            # re-translate everything
pnpm translate --provider deepl-free # use DeepL instead of Google
```

### Analytics

PostHog integration with an abstracted provider pattern:

- `trackEvent()` calls at signup, login, OAuth initiation, checkout, and profile update
- `trackPageView()` on route changes
- Cookie consent banner with localStorage persistence
- Analytics only fire after user accepts consent
- Provider can be swapped without touching feature code

### SEO

- `createMetadata()` factory for consistent page metadata with Open Graph and Twitter cards
- Dynamic OG image generation at `/api/og` (Edge runtime)
- JSON-LD structured data (Organization, WebSite schemas)
- `sitemap.xml` and `robots.txt` auto-generated
- Google site verification support

### Error Handling

Centralized error strategy with blame attribution:

- `ClientError` (400s), `ServerError` (500s), `ExternalServiceError` (502) — all in `@template/shared`
- `createErrorResponse()` utility converts errors to consistent JSON responses
- Error boundaries at root, `(app)`, `(auth)`, and `(marketing)` route groups — a crash in one section doesn't take down the others
- `global-error.tsx` as last-resort fallback (no providers required)
- Structured logging via Pino with context namespaces

### Logging

Pino structured JSON logger:

- Development: colorized, human-readable via `pino-pretty`
- Production: JSON with timestamps for log aggregation
- `createLogger('context')` factory produces child loggers with namespace

## Project Structure (Web App)

```
apps/web/
  app/
    (marketing)/       Public pages: home, pricing
    (auth)/            Auth flow: login, signup, verify-email, reset-password
    (app)/             Protected pages: dashboard, settings
    api/               API routes: auth, health, og, webhooks/stripe, mcp
    error.tsx          Root error boundary
    global-error.tsx   Last-resort error boundary
    layout.tsx         Root layout with i18n provider
    not-found.tsx      404 page
  components/
    ui/                shadcn/ui primitives (button, card, input, etc.)
    providers/         React Query, Analytics providers
    checkout-button    Stripe checkout trigger
    cookie-consent     GDPR consent banner
  features/
    profile/           Profile form, schema, server action
  lib/
    analytics/         Abstracted analytics with PostHog provider
    auth/              BetterAuth config, client bindings, guards, permissions
    db/                Drizzle setup, schema, migrations, seed
    email/             Provider abstraction, React Email templates
    errors.ts          createErrorResponse utility
    logger/            Pino logger factory
    mcp/               Model Context Protocol server, sandbox, spec
    payments/          Stripe setup, checkout, queries, entitlements
    routes.ts          Centralized route path constants
    seo/               Metadata factory, JSON-LD helpers
  messages/
    en.json            English translations (source of truth)
  i18n/
    request.ts         next-intl server configuration
  i18n.config.json     Translation target languages and provider
```

## Shared Package

`packages/shared/` is the single source of truth for cross-boundary types and constants:

- `roles.ts` — `USER_ROLES`, `ROLE_HIERARCHY`
- `subscriptions.ts` — `SUBSCRIPTION_STATUSES`
- `plans.ts` — `PLANS` (technical fields: price, role, externalPriceId)
- `errors.ts` — `AppError`, `ClientError`, `ServerError`, `ExternalServiceError`
- `api.ts` — `ApiResponse`, `ApiError`, `PaginatedResult` types
- `payments.ts` — `PaymentProvider` interface

## Services

### Go Worker (`services/worker/`)

Background job runner with PostgreSQL connectivity and graceful shutdown. Currently implements a 30-second heartbeat. Extend with queue consumers and cron jobs.

### Python Service (`services/python/`)

Data analysis and AI/ML service. Optional dependency groups:

```bash
pip install -e ".[data]"    # pandas, numpy, polars
pip install -e ".[ai]"      # openai, anthropic SDKs
pip install -e ".[jupyter]" # Jupyter notebooks
```

## Infrastructure

### AWS CDK (`infra/cdk/`)

Two stacks ready to deploy:

- **StorageStack** — S3 bucket with encryption, CORS, lifecycle rules, and IAM policy
- **MonitoringStack** — CloudWatch log group, SNS alarm topic, error metric filter

```bash
pnpm --filter @template/cdk synth    # synthesize CloudFormation
pnpm --filter @template/cdk deploy   # deploy to AWS
```

### Docker

Multi-stage Dockerfile for production:

```bash
docker compose up              # all services: web, worker, python, db, mailpit
docker compose up -d db mailpit  # just database + email (for local dev with pnpm dev)
```

The `docker-entrypoint.sh` runs Drizzle migrations on startup and optionally seeds the database when `SEED_DATABASE=true`.

## Testing

```bash
pnpm test              # unit tests (Vitest) — 111 tests across 13 files
pnpm test:e2e          # E2E tests (Playwright) — auth, navigation, payments
pnpm typecheck         # TypeScript strict mode
pnpm lint              # ESLint with i18n enforcement
pnpm format:check      # Prettier formatting check
```

Tests are colocated next to the code they test. Coverage excludes `node_modules`, `.next`, `components/ui`, and config files.

E2E tests run against Chromium, Firefox, and WebKit with 2 retries in CI. Playwright auto-starts the dev server.

## Code Quality

### ESLint

Flat config (`eslint.config.mjs`) with:

- `next/core-web-vitals` and `next/typescript` base
- `@typescript-eslint/strict` at the root level
- `eslint-plugin-i18next` — `no-literal-string` rule fails builds on hardcoded UI strings
- `no-restricted-imports` — prevents direct imports of `stripe`, `resend`, `nodemailer`, `posthog-js` (must go through abstraction layer)
- Provider implementation files are exempted from import restrictions

### Prettier

Auto-formatting on save and pre-commit:

- Single quotes, semicolons, trailing commas
- Print width: 100, tab width: 2
- LF line endings

### Pre-Commit Hooks

Husky + lint-staged runs on every commit:

- `.ts`, `.tsx` files: `eslint --fix` then `prettier --write`
- `.json`, `.md`, `.yml`, `.css` files: `prettier --write`

## CI/CD

### GitHub Actions

Three workflows:

- **`ci.yml`** — Runs on all pushes. Lint, typecheck, test, build, Go build, Python lint + test. Uses `SKIP_ENV_VALIDATION=1` so no secrets are needed.
- **`pr.yml`** — Runs on PRs to main. Same as CI plus Postgres service container, E2E tests, and CDK synth. Uploads Playwright report as artifact.
- **`deploy.yml`** — Runs on push to main. Conditional on `DEPLOY_TARGET`:
  - `vercel`: CDK deploy + smoke test
  - `docker`: Build and push to GHCR, CDK deploy + smoke test

All workflows use pnpm store caching and Turborepo remote caching (when configured).

## Environment Variables

See [`.env.example`](.env.example) for the complete list. Key variables:

| Variable                   | Required | Description                      |
| -------------------------- | -------- | -------------------------------- |
| `DEPLOY_TARGET`            | Yes      | `docker` or `vercel`             |
| `DATABASE_URL`             | Yes      | PostgreSQL connection string     |
| `BETTER_AUTH_SECRET`       | Yes      | Auth secret (min 32 chars)       |
| `STRIPE_SECRET_KEY`        | Yes      | Stripe secret key                |
| `STRIPE_WEBHOOK_SECRET`    | Yes      | Stripe webhook signing secret    |
| `NEXT_PUBLIC_APP_URL`      | Yes      | Application base URL             |
| `GOOGLE_CLIENT_ID`         | No       | Google OAuth                     |
| `GITHUB_CLIENT_ID`         | No       | GitHub OAuth                     |
| `RESEND_API_KEY`           | No       | Email (Vercel mode)              |
| `NEXT_PUBLIC_POSTHOG_KEY`  | No       | Analytics                        |
| `GOOGLE_TRANSLATE_API_KEY` | No       | i18n auto-translation            |
| `MCP_API_KEY`              | No       | MCP endpoint auth (min 32 chars) |

All variables are validated at startup via Zod (`@t3-oss/env-nextjs`). Set `SKIP_ENV_VALIDATION=true` to bypass during Docker builds or CI.

## API Routes

| Endpoint               | Method            | Auth         | Description                                                      |
| ---------------------- | ----------------- | ------------ | ---------------------------------------------------------------- |
| `/api/health`          | GET               | No           | Database connectivity check                                      |
| `/api/auth/[...all]`   | GET, POST         | Varies       | BetterAuth handler (signup, signin, signout, verify-email, etc.) |
| `/api/webhooks/stripe` | POST              | Signature    | Stripe webhook receiver with idempotency                         |
| `/api/og`              | GET               | No           | Dynamic Open Graph image generation (Edge)                       |
| `/api/mcp`             | POST, GET, DELETE | Bearer token | Model Context Protocol server                                    |

## MCP Integration

The template includes an MCP server at `/api/mcp` that exposes tools for searching the API spec, executing HTTP requests against the app, and browsing pages. Secured via `MCP_API_KEY` in production. Configuration is in `.mcp.json` at the project root.

## Coding Standards

See [CLAUDE.md](./CLAUDE.md) for the complete coding standards, architectural decisions, and conventions that guide development in this codebase.
