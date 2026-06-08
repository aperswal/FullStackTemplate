# Shared TypeScript Package

This package owns cross-app TypeScript contracts such as API response shapes, roles, subscription states, plans, payments, and shared error types.

Read `CLAUDE FILES/typescript.md` before changing it. Keep exports explicit from `src/index.ts` and avoid deep imports from consumers.

Prefer plain data types, enums or literal unions, and pure helper functions. Do not import Next.js, React, database clients, provider SDKs, or app-specific config here.

Every exported shape is a contract. Rename or remove fields only with coordinated updates to all consumers and tests.

Run `pnpm --filter @template/shared lint` and `pnpm --filter @template/shared typecheck` for changes here.
