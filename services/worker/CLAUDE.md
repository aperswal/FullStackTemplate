# Go Worker

The root `core.md` applies here. This service uses Go for background work and should follow idiomatic Go: small packages, explicit errors, context-aware operations, `gofmt`, `go test`, and `golangci-lint`.

Keep configuration in `config/`, application errors in `apperrors/`, and worker orchestration in focused modules. Do not read env directly outside config.

Every external input, queue payload, database row, and environment value must be validated before use. Use typed structs at boundaries and keep zero values intentional.

Return errors with enough context for logs and callers, but do not log secrets or raw payloads that may contain personal data.

Use `make verify` for this service. Add tests for concurrency, retry, shutdown, database failure, and error-classification behavior when those paths change.
