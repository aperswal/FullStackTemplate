# Python Tests

Tests are first-class code and must stay readable, isolated, and deterministic.

Use pytest through `uv run` or the local `make verify` target. Keep fixtures explicit and local unless multiple test modules need the same setup.

Test boundaries first: config validation, request parsing, health behavior, error mapping, provider failures, and database behavior when introduced.

Avoid network calls and real secrets. Use fakes or local fixtures for external providers and assert on behavior, not implementation details.

When fixing a bug, add the smallest failing test that reproduces it before changing production code.
