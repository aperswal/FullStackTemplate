# Payments

Payments touch money, entitlements, webhooks, and provider secrets. Read `CLAUDE FILES/security.md` before changing this folder.

Stripe is the provider boundary. Keep Stripe imports inside payment modules and expose typed internal functions for checkout, entitlement checks, plan mapping, and subscription queries.

Never trust client-reported prices, plan IDs, customer IDs, subscription status, or entitlement state. Resolve them server-side from validated config, database records, or verified Stripe events.

Webhook handling must be idempotent and signature-verified. Store enough event state to avoid double-applying changes.

Test plan mapping without Stripe, provider error handling, entitlement edge cases, and webhook transitions that grant or revoke access.
