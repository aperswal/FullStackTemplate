"""HTTP health server for the Python service."""

import json
import logging
from http.server import BaseHTTPRequestHandler, HTTPServer

from scripts.config import get_settings
from scripts.health import check_core_imports, check_database_connection

logger = logging.getLogger(__name__)

_STATUS_NOT_FOUND = 404
_STATUS_OK = 200
_STATUS_SERVICE_UNAVAILABLE = 503


class HealthHandler(BaseHTTPRequestHandler):
    """HTTP request handler for health check endpoints."""

    def do_GET(self) -> None:
        """Route GET requests to the appropriate handler."""
        if self.path == "/health":
            self._handle_health()
        else:
            self.send_response(_STATUS_NOT_FOUND)
            self.end_headers()

    def _handle_health(self) -> None:
        """Build and send the health check JSON response."""
        db_ok = check_database_connection()
        imports_ok = check_core_imports()
        status = "healthy" if db_ok and imports_ok else "degraded"
        code = _STATUS_OK if status == "healthy" else _STATUS_SERVICE_UNAVAILABLE

        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(
            json.dumps({"status": status, "database": db_ok, "imports": imports_ok}).encode(),
        )

    def log_message(self, fmt: str, *args: object) -> None:
        """Redirect HTTP server logs to the structured logger."""
        logger.info(fmt, *args)


def main() -> None:
    """Start the health check HTTP server."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    settings = get_settings()
    server = HTTPServer(("", settings.health_port), HealthHandler)
    logger.info("Health server listening on :%d", settings.health_port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down health server")
        server.server_close()


if __name__ == "__main__":
    main()
