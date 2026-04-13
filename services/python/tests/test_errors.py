"""Tests for the typed exception hierarchy."""

from scripts.errors import (
    AppError,
    ClientError,
    ExternalServiceError,
    ServerError,
)


class TestClientError:
    def test_defaults(self) -> None:
        err = ClientError("bad input")
        assert err.status_code == 400
        assert err.blame == "client"
        assert err.user_message == "bad input"
        assert str(err) == "bad input"

    def test_custom_status(self) -> None:
        err = ClientError("not found", status_code=404)
        assert err.status_code == 404

    def test_custom_user_message(self) -> None:
        err = ClientError("field X invalid", user_message="Please check your input")
        assert err.user_message == "Please check your input"
        assert str(err) == "field X invalid"

    def test_isinstance_app_error(self) -> None:
        assert isinstance(ClientError("test"), AppError)


class TestServerError:
    def test_defaults(self) -> None:
        err = ServerError("null pointer")
        assert err.status_code == 500
        assert err.blame == "server"
        assert err.user_message == "null pointer"

    def test_custom_status(self) -> None:
        err = ServerError("unavailable", status_code=503)
        assert err.status_code == 503

    def test_isinstance_app_error(self) -> None:
        assert isinstance(ServerError("test"), AppError)


class TestExternalServiceError:
    def test_defaults(self) -> None:
        err = ExternalServiceError("upstream timeout")
        assert err.status_code == 502
        assert err.blame == "external"

    def test_custom_status(self) -> None:
        err = ExternalServiceError("gateway timeout", status_code=504)
        assert err.status_code == 504

    def test_custom_user_message(self) -> None:
        err = ExternalServiceError("api failed", user_message="Please try again")
        assert err.user_message == "Please try again"

    def test_isinstance_app_error(self) -> None:
        assert isinstance(ExternalServiceError("test"), AppError)


class TestAppErrorDirect:
    def test_raise_and_catch(self) -> None:
        try:
            raise ServerError("test error")
        except AppError as e:
            assert e.blame == "server"

    def test_str_representation(self) -> None:
        err = ClientError("validation failed")
        assert "validation" in str(err)
