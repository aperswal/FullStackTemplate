# Python Service

Read `CLAUDE FILES/python.md`, `CLAUDE FILES/core.md`, and `CLAUDE FILES/security.md` for config, external input, database access, or provider calls.

Use `uv` for every environment and dependency operation. Run code through `uv run`; do not use raw `pip`, ad hoc virtualenv commands, Poetry, or Conda inside this project.

Keep strict typing intact. Every function signature needs annotations, and mypy strict failures are build failures. Avoid `Any`, blanket ignores, and casts unless the boundary has been narrowed and tested.

Pydantic models define external input and config. Parse at the boundary in `scripts/config.py`, handlers, CLI entrypoints, or file readers, then pass typed values inward.

If this service owns or shares the SQL schema, introduce and use Alembic as the migration owner. Do not let Drizzle and Alembic both write migrations for the same database.

Relevant checks live behind `make verify` in this folder.
