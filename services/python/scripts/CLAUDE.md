# Python Runtime Modules

This folder contains the Python service implementation modules. Keep production behavior here and tests in `../tests`.

Separate configuration, health, error mapping, and server behavior into focused modules. Do not read environment variables outside the settings/config module.

Use Pydantic for request, file, provider, and config boundaries. Internal functions should accept typed domain values, not raw dictionaries from outside the service.

Use structured logging through the established logging path when added; do not use `print()` for application logs. CLI-only output may be an exception when the pyproject rule explicitly allows it.

Handle errors with blame attribution and preserve useful context without leaking secrets.
