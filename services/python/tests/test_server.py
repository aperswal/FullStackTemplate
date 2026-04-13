"""Tests for the HTTP health server."""

import json
import threading
from http import HTTPStatus
from http.server import HTTPServer
from unittest.mock import patch
from urllib.request import Request, urlopen

import pytest

from scripts.server import HealthHandler, main


@pytest.fixture
def health_server() -> int:  # type: ignore[misc]
    """Start the health server on an ephemeral port for testing."""
    server = HTTPServer(("127.0.0.1", 0), HealthHandler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield port
    server.shutdown()
    server.server_close()


def _get(port: int, path: str) -> tuple[int, bytes]:
    """Issue a GET request and return (status_code, body)."""
    request = Request(f"http://127.0.0.1:{port}{path}")
    try:
        response = urlopen(request)
        return response.status, response.read()
    except Exception as exc:
        if hasattr(exc, "code") and hasattr(exc, "read"):
            return exc.code, exc.read()
        raise


class TestHealthEndpoint:
    def test_returns_200_with_valid_json(self, health_server: int) -> None:
        status, body = _get(health_server, "/health")
        assert status == HTTPStatus.OK
        data = json.loads(body)
        assert isinstance(data, dict)

    def test_response_has_required_keys(self, health_server: int) -> None:
        _, body = _get(health_server, "/health")
        data = json.loads(body)
        assert "status" in data
        assert "database" in data
        assert "imports" in data

    def test_healthy_status_when_checks_pass(self, health_server: int) -> None:
        _, body = _get(health_server, "/health")
        data = json.loads(body)
        assert data["status"] == "healthy"
        assert data["database"] is True
        assert data["imports"] is True

    def test_degraded_status_when_database_fails(self, health_server: int) -> None:
        with patch("scripts.server.check_database_connection", return_value=False):
            status, body = _get(health_server, "/health")
        assert status == HTTPStatus.SERVICE_UNAVAILABLE
        data = json.loads(body)
        assert data["status"] == "degraded"
        assert data["database"] is False

    def test_degraded_status_when_imports_fail(self, health_server: int) -> None:
        with patch("scripts.server.check_core_imports", return_value=False):
            status, body = _get(health_server, "/health")
        assert status == HTTPStatus.SERVICE_UNAVAILABLE
        data = json.loads(body)
        assert data["status"] == "degraded"
        assert data["imports"] is False


class TestUnknownPaths:
    def test_root_returns_404(self, health_server: int) -> None:
        status, _ = _get(health_server, "/")
        assert status == HTTPStatus.NOT_FOUND

    def test_random_path_returns_404(self, health_server: int) -> None:
        status, _ = _get(health_server, "/nonexistent")
        assert status == HTTPStatus.NOT_FOUND


class TestMain:
    def test_main_starts_and_stops_server(self) -> None:
        """Verify main() creates a server and handles KeyboardInterrupt gracefully."""
        with patch("scripts.server.HTTPServer") as mock_server_cls:
            mock_server = mock_server_cls.return_value
            mock_server.serve_forever.side_effect = KeyboardInterrupt
            main()
            mock_server.serve_forever.assert_called_once()
            mock_server.server_close.assert_called_once()
