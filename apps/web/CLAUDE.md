# Web App

This is the Next.js App Router application. Read the root instructions plus `CLAUDE FILES/typescript.md`, `CLAUDE FILES/ux.md` for interface work, and `CLAUDE FILES/security.md` for auth, route handlers, webhooks, MCP, payments, rate limiting, or any external input.

Keep the app stateless over server-owned data. Canonical data belongs on the server and in the database; the client may hold only ephemeral view state such as open menus, draft input, and optimistic transitions that can be rebuilt after refresh.

Use `app/` for routing and page composition, `features/` for product behavior, `lib/` for shared infrastructure, `components/ui/` for primitives, and `messages/` for user-visible copy. Do not bypass these boundaries for convenience.

All external data must be validated at the boundary with Zod or the established wrapper around the route/action. Import validated env from `lib/env.ts`; never read `process.env` directly outside that module.

Relevant checks:

- `pnpm --filter @template/web lint`
- `pnpm --filter @template/web typecheck`
- `pnpm --filter @template/web test`
- `pnpm --filter @template/web test:coverage`
- `pnpm --filter @template/web validate:mcp`
