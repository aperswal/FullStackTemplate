.PHONY: lint typecheck test verify format format-check coverage-ratchet

VENV := .venv/bin

lint:
	$(VENV)/ruff check .

format:
	$(VENV)/ruff format .

format-check:
	$(VENV)/ruff format --check .

typecheck:
	$(VENV)/mypy scripts/ tests/

test:
	$(VENV)/pytest

coverage-ratchet:
	$(VENV)/python3 scripts/coverage_ratchet.py

verify: format-check lint typecheck test coverage-ratchet
