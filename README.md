# Full-Stack Template

Production-ready monorepo template with Next.js, Go, and Python. Switch between SaaS deployment (Vercel) and self-hosted (Docker) with one environment variable.

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker & Docker Compose
- Go 1.24+ (for worker service)
- Python 3.12+ (for data/AI service)

## Quick Start

```bash
cp .env.example .env          # configure environment variables
pnpm install                   # install Node.js dependencies
docker compose up -d db mailpit  # start Postgres + Mailpit
pnpm dev                       # start Next.js dev server
```

## Architecture

```
apps/web/              Next.js 15 (App Router) — UI, API routes, auth, payments
packages/shared/       Shared types, constants, interfaces (single source of truth)
services/worker/       Go worker — background jobs, health check, DB heartbeat
services/python/       Python service — data analysis, AI/ML, scripts, notebooks
infra/cdk/             AWS CDK stacks — storage, monitoring
e2e/                   Playwright end-to-end tests
```

## Deploy Mode (`DEPLOY_TARGET`)

Set `DEPLOY_TARGET` in `.env` to control behavior across the stack:

| Concern        | `docker` (self-hosted) | `vercel` (SaaS) |
| -------------- | ---------------------- | --------------- |
| Email          | SMTP (Mailpit in dev)  | Resend          |
| Next.js output | standalone             | default         |
| Hosting        | Docker Compose         | Vercel          |
| Analytics      | Opt-in via PostHog key | PostHog         |

## Running All Services

```bash
docker compose up        # starts: web, worker, python, db, mailpit
```

## Testing

```bash
pnpm test              # unit tests (Vitest)
pnpm test:e2e          # E2E tests (Playwright)
pnpm typecheck         # TypeScript strict mode
pnpm lint              # ESLint
```

## Coding Standards

See [CLAUDE.md](./CLAUDE.md) for the full coding standards and architectural decisions.
