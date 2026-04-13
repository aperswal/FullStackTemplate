"""Typed exception hierarchy with blame attribution.

Mirrors the ClientError/ServerError/ExternalServiceError pattern from TypeScript.
All production code must use these instead of bare ``raise Exception``.
"""

from typing import Literal

Blame = Literal["client", "server", "external"]

_DEFAULT_CLIENT_STATUS = 400
_DEFAULT_SERVER_STATUS = 500
_DEFAULT_EXTERNAL_STATUS = 502


class AppError(Exception):
    """Base error with HTTP status code and blame attribution."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int,
        blame: Blame,
        user_message: str | None = None,
    ) -> None:
        """Initialize with message, status code, blame, and optional user message."""
        super().__init__(message)
        self.status_code = status_code
        self.blame: Blame = blame
        self.user_message = user_message or message


class ClientError(AppError):
    """Error caused by the caller (default 400)."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int = _DEFAULT_CLIENT_STATUS,
        user_message: str | None = None,
    ) -> None:
        """Initialize client error with optional status code override."""
        super().__init__(
            message,
            status_code=status_code,
            blame="client",
            user_message=user_message,
        )


class ServerError(AppError):
    """Error caused by an internal server failure (default 500)."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int = _DEFAULT_SERVER_STATUS,
        user_message: str | None = None,
    ) -> None:
        """Initialize server error with optional status code override."""
        super().__init__(
            message,
            status_code=status_code,
            blame="server",
            user_message=user_message,
        )


class ExternalServiceError(AppError):
    """Error caused by a third-party service (default 502)."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int = _DEFAULT_EXTERNAL_STATUS,
        user_message: str | None = None,
    ) -> None:
        """Initialize external service error with optional status code override."""
        super().__init__(
            message,
            status_code=status_code,
            blame="external",
            user_message=user_message,
        )
