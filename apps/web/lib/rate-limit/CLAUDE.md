# Rate Limiting

Rate limiting protects trust boundaries and availability. Read `CLAUDE FILES/security.md` before changing this folder.

Keep limiter selection centralized so deploy target differences stay predictable: Upstash for hosted environments and the documented fallback for local or single-instance development.

Keys must be stable enough to limit abuse but must not leak secrets or raw personal data. Prefer hashed user IDs, session IDs, IP-derived keys, or route-scoped keys depending on the threat.

Fail closed for sensitive operations when the limiter cannot determine safety. For low-risk public reads, make the fallback decision explicit and test it.

Tests should cover missing provider config, authenticated vs unauthenticated quotas, and route-specific limit behavior.
