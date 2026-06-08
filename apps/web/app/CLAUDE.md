# App Router

This folder owns URL structure, layouts, route groups, metadata, loading states, and error boundaries. Product logic should live in `features/` or `lib/`, then be composed here.

Prefer Server Components by default. Add `"use client"` only when a component needs browser-only APIs, event handlers, local interactive state, or client-side library hooks.

Every route group should make its state model explicit: loading, error, empty, unauthorized, and successful states should be reachable and tested when behavior is nontrivial.

Keep route groups focused:

- `(marketing)` is public, crawlable, and SEO-sensitive.
- `(auth)` handles sign-in, sign-up, reset, and verification flows.
- `(app)` is authenticated product surface and must rely on server-side auth checks, not hidden UI.

Use `lib/seo` for metadata helpers and `messages/` for user-facing strings. Do not hardcode production copy in components when the i18n lint rules require message keys.
