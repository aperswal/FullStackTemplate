# Web Lib

This folder contains shared infrastructure for the web app: auth, API wrappers, env validation, database access, logging, analytics, payments, rate limiting, SEO, email, MCP, routes, and test utilities.

Read the root `core.md` first. For almost any change here, also read `typescript.md`; read `security.md` when the module touches trust boundaries, auth, secrets, provider calls, or external input.

Keep each module the single owner of its concern. Other code should import from these modules instead of reaching into providers, `process.env`, raw clients, or ad hoc response helpers.

Define typed contracts at every boundary and validate external data once at entry. After validation, pass typed values inward rather than re-parsing in every layer.

Shared code has a wider blast radius than route or feature code. Add or update tests for normal behavior, edge cases, provider failures, and authorization-sensitive branches.
