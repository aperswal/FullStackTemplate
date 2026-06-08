# API Routes

API handlers are trust boundaries. Read `CLAUDE FILES/security.md` before changing anything here.

Validate request bodies, search params, headers, webhook payloads, and route params before use. Prefer the established `lib/api` wrappers so response shape, status codes, logging, correlation, and blame attribution stay consistent.

Authorization belongs on the server for every request. Hidden buttons, client redirects, and route-group layouts are not access control.

For webhooks, preserve raw-body and signature verification requirements. Make handlers idempotent, store external event IDs when needed, and return status codes that reflect the real outcome.

Do not leak secrets, stack traces, provider payloads, or internal identifiers in responses. Log enough context to debug, but never log tokens, cookies, API keys, or payment secrets.
