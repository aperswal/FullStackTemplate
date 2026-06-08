# Auth

Authentication and authorization are security-critical. Read `CLAUDE FILES/security.md` before changing this folder.

Use the existing Better Auth integration and guard helpers. Do not invent session handling, password hashing, token parsing, or cookie semantics.

Every protected operation must check authorization on the server. UI conditions are only affordances; they are never permission checks.

Keep permission rules explicit, typed, and test-covered. Prefer named guards over scattered role comparisons so policy changes are easy to audit.

Never expose session tokens, OAuth secrets, password reset tokens, verification tokens, or provider responses in client components, logs, analytics, or thrown errors.
