# Project Instructions — Index

The engineering rules for this codebase are split into scoped files under `CLAUDE FILES/`. These instructions OVERRIDE any default behavior and you MUST follow them exactly. At the start of any task, read the files that apply to the work:

- **`CLAUDE FILES/core.md`** — language-agnostic principles: a deduplicated synthesis of *The Pragmatic Programmer*, *Clean Code*, and *Code Complete* plus this project's own conventions. **Always applies, to every task, in every language.** Read it first.
- **`CLAUDE FILES/typescript.md`** — concrete tooling for TypeScript / Next.js web apps. Read it whenever the task touches TypeScript, React, or the web frontend.
- **`CLAUDE FILES/python.md`** — concrete tooling for Python services, APIs, and scripts (uv, PyPI, strict typing, ruff, Pydantic, SQLAlchemy + Alembic, FastAPI, pytest, structlog). Read it whenever the task touches Python.
- **`CLAUDE FILES/ux.md`** — product discovery and UX design: a synthesis of usability and product-design practice (Norman, Krug, *The Mom Test*, continuous discovery, product strategy). Read it whenever the task involves users, product decisions, or interface design.
- **`CLAUDE FILES/research.md`** — research and evidence synthesis: framing research questions, systematic search, screening, risk-of-bias evaluation, meta-analysis, and reporting. Read it whenever the task involves literature review, evidence gathering, or synthesizing prior work.
- **`CLAUDE FILES/security.md`** — secure coding and security design: threat modeling (STRIDE, attack trees), server-side authorization, untrusted input, injection/XSS, authentication, cryptography, secrets, and operations. Read it whenever the task touches auth, untrusted input, API routes, cryptography, secrets, or any trust boundary.
- **`CLAUDE FILES/writing/`** — five-stage adversarial writing pipeline (intake → template → storyboard → fill → review) plus craft/persuasion/screenwriting/comedy/line-edit lenses and a voice reference. Start at `CLAUDE FILES/writing/pipeline.md` whenever the task is to write or substantially revise a real piece of communication (doc, talk, proposal, copy, email). Working copy installed as the `writing` skill.

## Cross-stack rules

- When a codebase contains **both** TypeScript and Python, read `core.md`, `typescript.md`, and `python.md` together.
- **SQL migrations:** whenever Python is present, **Alembic owns all schema migrations** (see `python.md`) and is preferred over Drizzle's migration tooling. Drizzle may still define the schema for type derivation on the TS side, but must never run migrations against an Alembic-managed database. Never let both tools write migrations to the same database.
- Keep these files as the single source of truth: shared principles live only in `core.md`, and each tool is named in exactly one stack file. Do not copy rules between files.
