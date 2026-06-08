# Features

Feature folders own product behavior: validation schemas, server actions, queries, feature components, tests, and domain-specific types that are not reusable across the whole app.

Colocate the contract with the behavior. A feature input should have its Zod schema, inferred TypeScript type, action or query, and tests nearby.

Keep server actions and queries thin but complete: validate input, enforce authorization, call the database or provider through existing libraries, and return the standard success/error shape.

Do not reach across feature folders for private details. If two features need the same concept, move the stable contract to `packages/shared` or a focused `lib/` module after the duplication is real.

Every meaningful branch in feature behavior should have a unit or integration test next to the feature.
