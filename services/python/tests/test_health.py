"""Tests for the Python service health checks."""

import builtins
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from scripts.health import check_core_imports, check_database_connection, main


def test_core_imports_available() -> None:
    """All required packages should be importable."""
    assert check_core_imports() is True


def test_httpx_importable() -> None:
    import httpx  # noqa: F401, PLC0415


def test_pydantic_importable() -> None:
    import pydantic  # noqa: F401, PLC0415


def test_dotenv_importable() -> None:
    import dotenv  # noqa: F401, PLC0415


def test_core_imports_returns_false_when_package_missing() -> None:
    original_import = builtins.__import__

    def mock_import(name: str, *args: Any, **kwargs: Any) -> Any:
        if name == "httpx":
            raise ImportError(name)
        return original_import(name, *args, **kwargs)

    with patch("builtins.__import__", side_effect=mock_import):
        assert check_core_imports() is False


def test_database_connection_returns_true_without_database_url() -> None:
    with patch.dict("os.environ", {}, clear=True):
        assert check_database_connection() is True


def test_database_connection_returns_false_on_connection_error() -> None:
    with patch.dict("os.environ", {"DATABASE_URL": "postgresql://invalid:5432/nodb"}):
        assert check_database_connection() is False


def test_main_exits_on_failure() -> None:
    with patch("scripts.health.check_core_imports", return_value=False):
        with pytest.raises(SystemExit) as exc_info:
            main()
        assert exc_info.value.code == 1


def test_main_succeeds_when_all_checks_pass() -> None:
    with (
        patch("scripts.health.check_core_imports", return_value=True),
        patch("scripts.health.check_database_connection", return_value=True),
    ):
        main()


def _make_mock_connection(fetchone_result: object) -> MagicMock:
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = fetchone_result

    mock_conn = MagicMock()
    mock_conn.__enter__ = MagicMock(return_value=mock_conn)
    mock_conn.__exit__ = MagicMock(return_value=False)
    mock_conn.cursor.return_value.__enter__ = MagicMock(return_value=mock_cursor)
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)

    return mock_conn


def test_database_connection_succeeds_with_valid_url() -> None:
    """Verify the successful path through psycopg connect."""
    mock_conn = _make_mock_connection(fetchone_result=(1,))

    with (
        patch.dict("os.environ", {"DATABASE_URL": "postgresql://test:5432/testdb"}),
        patch("psycopg.connect", return_value=mock_conn),
    ):
        assert check_database_connection() is True


def test_database_connection_returns_false_when_query_returns_unexpected() -> None:
    """Verify False is returned when SELECT 1 gives an unexpected result."""
    mock_conn = _make_mock_connection(fetchone_result=None)

    with (
        patch.dict("os.environ", {"DATABASE_URL": "postgresql://test:5432/testdb"}),
        patch("psycopg.connect", return_value=mock_conn),
    ):
        assert check_database_connection() is False
