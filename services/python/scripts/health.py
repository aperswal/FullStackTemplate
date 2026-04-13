"""Health check script — verifies the Python environment is functional."""

import logging
import sys

from scripts.config import get_settings

logger = logging.getLogger(__name__)


def check_database_connection() -> bool:
    """Verify database connectivity via psycopg."""
    database_url = get_settings().database_url
    if not database_url:
        logger.warning("DATABASE_URL not set, skipping database check")
        return True

    try:
        import psycopg  # noqa: PLC0415

        with psycopg.connect(database_url) as conn, conn.cursor() as cur:
            cur.execute("SELECT 1")
            result = cur.fetchone()
            return result is not None and result[0] == 1
    except psycopg.Error:
        logger.exception("Database connection failed")
        return False


def check_core_imports() -> bool:
    """Verify required packages are importable."""
    required = ["httpx", "pydantic", "dotenv", "psycopg"]
    missing = []
    for package in required:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)

    if missing:
        logger.error("Missing packages: %s", ", ".join(missing))
        return False
    return True


def main() -> None:
    """Run all health checks and exit with status code."""
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    logger.info("Python service health check...")
    imports_ok = check_core_imports()
    db_ok = check_database_connection()

    if imports_ok and db_ok:
        logger.info("All checks passed")
    else:
        logger.error("Some checks failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
