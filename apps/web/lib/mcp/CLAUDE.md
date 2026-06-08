# MCP

The MCP server exposes app capability to external agents, so it is both a product surface and a trust boundary. Read `CLAUDE FILES/security.md` and `CLAUDE FILES/ux.md` before changing it.

Keep the public spec accurate, minimal, and generated or validated by `pnpm --filter @template/web validate:mcp`. A tool documented in the spec must match the implemented behavior.

Sandbox anything that executes caller-provided code. Restrict available helpers, validate inputs, enforce rate limits, and make authentication context explicit.

Unauthenticated and authenticated callers must get different capabilities only through server-side checks. Never rely on client-provided claims.

Return consistent, blame-attributed errors so agent callers can recover without seeing internal details.
