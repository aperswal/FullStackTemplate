"""Health check script — verifies the Python environment is functional."""

import os
import sys


def check_database_connection() -> bool:
    """Verify database connectivity via psycopg."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("WARN: DATABASE_URL not set, skipping database check")
        return True

    try:
        import psycopg

        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                result = cur.fetchone()
                return result is not None and result[0] == 1
    except Exception as e:
        print(f"ERROR: Database connection failed: {e}")
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
        print(f"ERROR: Missing packages: {', '.join(missing)}")
        return False
    return True


def main() -> None:
    print("Python service health check...")
    imports_ok = check_core_imports()
    db_ok = check_database_connection()

    if imports_ok and db_ok:
        print("OK: All checks passed")
    else:
        print("FAIL: Some checks failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
