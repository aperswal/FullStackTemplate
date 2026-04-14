# Full-Stack Template

## Philosophy

Build the boring stuff once, then reuse it everywhere. This template wires together authentication, payments, email, database, analytics, and deployment so every new project starts with a working stack instead of a blank canvas. It follows a tracer-bullet approach: each feature is a thin working path through the entire stack (UI, server, database, integrations) before any single layer gets expanded. No premature abstractions - duplication is tolerated until a second concrete case reveals the right boundary.

## Standards

- TypeScript in strict mode across the entire codebase. No `any`, no opt-outs.
- 95% test coverage threshold for lines, branches, functions, and statements.
- ESLint with `@typescript-eslint/strict`, `no-literal-string` (i18n enforcement), `no-console`, restricted direct imports for providers, and restricted `process.env` access.
- Prettier auto-formatting on save and pre-commit.
- Husky + lint-staged: every commit runs ESLint and Prettier on staged files. No failing code enters the repository.
- Structured JSON logging via Pino with context namespaces and sensitive-field redaction.
- Error boundaries at every route group with blame attribution (`ClientError`, `ServerError`, `ExternalServiceError`).
- Correlation IDs propagated through the full request lifecycle via AsyncLocalStorage.

See [CLAUDE.md](./CLAUDE.md) for the complete coding standards and architectural decisions.

## Technologies and Why

| Technology              | Role                                         |
| ----------------------- | -------------------------------------------- |
| Next.js 15 (App Router) | Routing, server rendering, API routes        |
| Drizzle ORM             | Type-safe database queries and migrations    |
| BetterAuth              | Authentication with email/password and OAuth |
| Stripe                  | Subscription payments and webhook lifecycle  |
| Pino                    | Structured JSON logging                      |
| shadcn/ui               | Pre-built, customizable UI primitives        |
| Tailwind CSS            | Utility-first styling                        |
| Zod                     | Runtime validation of all external data      |
| React Email             | Transactional email templates                |
| next-intl               | Internationalization with ESLint enforcement |
| Vitest                  | Unit and integration testing                 |
| Playwright              | End-to-end browser testing                   |
| pnpm                    | Strict dependency isolation                  |
| Turborepo               | Monorepo task orchestration                  |
| Husky + lint-staged     | Pre-commit quality gates                     |
| OpenTelemetry           | Distributed tracing                          |
| AWS CDK                 | Infrastructure as code (S3, CloudWatch, ECS) |
| PostHog                 | Privacy-respecting analytics                 |

## Languages and Why

| Language   | Where                         | Why                                             |
| ---------- | ----------------------------- | ----------------------------------------------- |
| TypeScript | Web app, infrastructure (CDK) | Type safety across UI, API, database, and infra |
| Go         | Worker service                | Lightweight background jobs with fast startup   |
| Python     | Data/AI service               | Ecosystem for data analysis, ML, and notebooks  |

## Prerequisites

Install all required tools before setting up the project. Commands below are for macOS (Homebrew); see linked docs for other platforms.

```bash
# Node.js (LTS)
brew install node

# pnpm (package manager)
brew install pnpm

# Docker Desktop - https://docs.docker.com/desktop/install/mac-install/
brew install --cask docker

# Go (worker service)
brew install go

# golangci-lint (Go linter)
brew install golangci-lint

# Python 3.12+ (data/AI service)
brew install python@3.12

# uv (Python package manager) - https://docs.astral.sh/uv/
brew install uv

# Install Python dev dependencies
cd services/python && uv pip install -e ".[dev]" && cd ../..
```

Verify everything is available:

```bash
node -v && pnpm -v && docker -v && go version && golangci-lint version && python3 --version && uv --version
```

## SaaS Setup

Set `DEPLOY_TARGET=vercel` in `.env`.

- **Hosting**: Vercel (automatic from `vercel.json`)
- **Email**: Resend (`RESEND_API_KEY`)
- **Rate limiting**: Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- **Analytics**: PostHog (`NEXT_PUBLIC_POSTHOG_KEY`)

## Open Source Setup

Set `DEPLOY_TARGET=docker` in `.env`.

```bash
docker compose up              # all services: web, worker, python, db, mailpit
docker compose up -d db mailpit  # just database + email (for local dev with pnpm dev)
```

- **Email**: SMTP with Mailpit for local development (http://localhost:8025)
- **Rate limiting**: In-memory (fine for single-instance)
- **Next.js output**: `standalone` for containerized deployment

## Environment Setup

### Automated

```bash
./scripts/setup.sh
```

The interactive wizard walks through every service - prerequisites, database, Stripe, OAuth, email, analytics, translation, and more. It is resumable: re-running picks up where you left off.

### Manual

```bash
cp .env.example .env              # configure environment variables
pnpm install                       # install Node.js dependencies
docker compose up -d db mailpit    # start Postgres + Mailpit
cd apps/web && pnpm db:migrate     # run database migrations
cd ../.. && pnpm dev               # start dev server
```

Open http://localhost:3000 in your browser.

## MCP Configuration

The template exposes a user-facing MCP server at `/api/mcp` so any AI agent can discover and use the site. Two tools follow the Cloudflare Code Mode pattern:

- **`search`** - query the site spec (pages + actions) by writing a JavaScript arrow function
- **`execute`** - run JavaScript with `browse(path)` and `request({ method, path, body? })` helpers to read pages and call APIs

No API key is required to connect. When a `better-auth.session_token` cookie is forwarded, authenticated actions become available; the app's own access control enforces permissions (401/403 on protected routes). Unauthenticated callers get 10 req/min; authenticated callers get 30 req/min.

Discovery endpoint: `GET /.well-known/mcp.json`.

Configuration in `.mcp.json`:

```json
{
  "mcpServers": {
    "fullstack-template": {
      "type": "sse",
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```
