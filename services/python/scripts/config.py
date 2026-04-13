"""Validated application configuration.

This is the only module allowed to read os.environ / os.getenv.
All other modules must import settings from here.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings validated at startup."""

    database_url: str | None = None
    health_port: int = 8000
    log_level: str = "INFO"

    @field_validator("health_port")
    @classmethod
    def validate_port(cls, v: int) -> int:
        """Ensure port is within valid TCP range."""
        min_port = 1
        max_port = 65535
        if not min_port <= v <= max_port:
            msg = f"health_port must be between {min_port} and {max_port}, got {v}"
            raise ValueError(msg)
        return v

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Ensure log level is a recognized value."""
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = v.upper()
        if upper not in allowed:
            msg = f"log_level must be one of {allowed}, got {v!r}"
            raise ValueError(msg)
        return upper

    model_config = {"env_prefix": "", "case_sensitive": False}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings, loading from environment on first call."""
    return Settings()


def reset_settings() -> None:
    """Clear cached settings. Used in tests to pick up new env vars."""
    get_settings.cache_clear()
