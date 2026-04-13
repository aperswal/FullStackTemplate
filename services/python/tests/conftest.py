"""Shared test fixtures."""

from collections.abc import Generator

import pytest

from scripts.config import reset_settings


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> Generator[None, None, None]:
    """Reset cached settings before each test so env var patches take effect."""
    reset_settings()
    yield
    reset_settings()
