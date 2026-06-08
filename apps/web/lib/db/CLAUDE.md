# Database

This folder owns web-app database schema, migrations, connections, and seed behavior. Read `CLAUDE FILES/typescript.md`, `CLAUDE FILES/security.md`, and the root cross-stack migration rule before changing schema or queries.

Keep schemas organized by domain and derive application types from Drizzle definitions. Query only the fields needed, paginate lists, and use transactions for multi-step writes that must succeed or fail together.

Migration ownership must be explicit. If the Python service shares or owns the same database, Alembic is the single source of truth for SQL migrations and Drizzle must not generate or apply migrations against that database. If this web app is the sole schema owner, keep Drizzle migrations reviewed and reversible.

Do not read database URLs directly from env. Use validated config and the shared connection module.

Tests should cover constraints, authorization-sensitive queries, transaction failure behavior, and idempotent seed or migration helpers.
