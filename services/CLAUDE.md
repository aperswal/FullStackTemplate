# Services Workspace

Services are independently runnable backend processes. Root `CLAUDE.md` and `CLAUDE FILES/core.md` always apply; use `python.md` for Python and the local Go guidance in `services/worker/CLAUDE.md` for the worker.

Keep service boundaries explicit. A service should validate config at startup, expose health checks, use structured logs, handle shutdown cleanly, and make its database or queue ownership clear.

Do not share secrets through code, logs, checked-in env files, or test fixtures. Use validated settings modules and documented environment variables.

When a service shares contracts with the web app, put stable data shapes in `packages/shared` only when TypeScript consumers need them. Otherwise keep service-local models close to their handlers.
