# Apps Workspace

Root `CLAUDE.md` and `CLAUDE FILES/core.md` always apply here. For any app written in TypeScript or React, also read `CLAUDE FILES/typescript.md`; for user-facing work, read `CLAUDE FILES/ux.md`; for auth, API routes, webhooks, secrets, or untrusted input, read `CLAUDE FILES/security.md`.

This directory is for runnable applications, not shared abstractions. Keep app-specific routing, composition, deployment wiring, and user workflows inside the owning app. Move code to `packages/` only after two apps need the same contract or behavior.

Favor thin vertical slices through the stack. A feature should prove the real path from UI to server behavior to persistence or integration before any one layer is expanded heavily.

Use the workspace commands from the root whenever possible: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and the narrow package command when the change is isolated.
