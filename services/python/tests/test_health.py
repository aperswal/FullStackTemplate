"""Tests for the Python service health checks."""

from scripts.health import check_core_imports


def test_core_imports_available():
    """All required packages should be importable."""
    assert check_core_imports() is True


def test_httpx_importable():
    import httpx  # noqa: F401


def test_pydantic_importable():
    import pydantic  # noqa: F401


def test_dotenv_importable():
    import dotenv  # noqa: F401
