"""Tests for the config module."""

from unittest.mock import patch

import pytest

from scripts.config import Settings


def test_defaults() -> None:
    """Default settings load when no env vars are set."""
    with patch.dict("os.environ", {}, clear=True):
        s = Settings()
    assert s.database_url is None
    assert s.health_port == 8000
    assert s.log_level == "INFO"


def test_database_url_from_env() -> None:
    """DATABASE_URL is picked up from the environment."""
    with patch.dict("os.environ", {"DATABASE_URL": "postgres://localhost/db"}):
        s = Settings()
    assert s.database_url == "postgres://localhost/db"


def test_custom_health_port() -> None:
    """HEALTH_PORT overrides the default."""
    with patch.dict("os.environ", {"HEALTH_PORT": "9090"}):
        s = Settings()
    assert s.health_port == 9090


def test_invalid_health_port_zero() -> None:
    """Port 0 is rejected."""
    with (
        patch.dict("os.environ", {"HEALTH_PORT": "0"}),
        pytest.raises(ValueError, match="health_port"),
    ):
        Settings()


def test_invalid_health_port_too_high() -> None:
    """Port above 65535 is rejected."""
    with (
        patch.dict("os.environ", {"HEALTH_PORT": "70000"}),
        pytest.raises(ValueError, match="health_port"),
    ):
        Settings()


def test_invalid_health_port_non_numeric() -> None:
    """Non-numeric port is rejected."""
    with patch.dict("os.environ", {"HEALTH_PORT": "abc"}), pytest.raises(ValueError):
        Settings()


def test_log_level_case_insensitive() -> None:
    """Log level is normalized to uppercase."""
    with patch.dict("os.environ", {"LOG_LEVEL": "debug"}):
        s = Settings()
    assert s.log_level == "DEBUG"


def test_invalid_log_level() -> None:
    """Invalid log level is rejected."""
    with (
        patch.dict("os.environ", {"LOG_LEVEL": "TRACE"}),
        pytest.raises(ValueError, match="log_level"),
    ):
        Settings()
