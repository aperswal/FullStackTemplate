// Package apperrors provides typed error constructors with blame attribution.
// Mirrors the ClientError/ServerError/ExternalServiceError pattern from TypeScript.
package apperrors

import "fmt"

// Blame indicates which party is responsible for the error.
type Blame string

const (
	// BlameClient indicates the caller made a bad request.
	BlameClient Blame = "client"
	// BlameServer indicates an internal server failure.
	BlameServer Blame = "server"
	// BlameExternal indicates a third-party service failed.
	BlameExternal Blame = "external"
)

// AppError is a structured error with blame attribution and HTTP status code.
type AppError struct {
	Message     string
	StatusCode  int
	Blame       Blame
	UserMessage string
	cause       error
}

// Error implements the error interface.
func (e *AppError) Error() string {
	if e.cause != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.cause)
	}
	return e.Message
}

// Unwrap returns the underlying cause for errors.Is/As compatibility.
func (e *AppError) Unwrap() error {
	return e.cause
}

// Option configures an AppError.
type Option func(*AppError)

// WithStatusCode overrides the default HTTP status code.
func WithStatusCode(code int) Option {
	return func(e *AppError) { e.StatusCode = code }
}

// WithCause attaches an underlying error for unwrapping.
func WithCause(err error) Option {
	return func(e *AppError) { e.cause = err }
}

// WithUserMessage sets a user-facing message distinct from the internal message.
func WithUserMessage(msg string) Option {
	return func(e *AppError) { e.UserMessage = msg }
}

func newAppError(msg string, status int, blame Blame, opts []Option) *AppError {
	e := &AppError{
		Message:     msg,
		StatusCode:  status,
		Blame:       blame,
		UserMessage: msg,
	}
	for _, opt := range opts {
		opt(e)
	}
	return e
}

// ClientError creates an error blamed on the caller (default 400).
func ClientError(msg string, opts ...Option) *AppError {
	return newAppError(msg, 400, BlameClient, opts) //nolint:mnd // HTTP 400
}

// ServerError creates an error blamed on the server (default 500).
func ServerError(msg string, opts ...Option) *AppError {
	return newAppError(msg, 500, BlameServer, opts) //nolint:mnd // HTTP 500
}

// ExternalServiceError creates an error blamed on a third-party service (default 502).
func ExternalServiceError(msg string, opts ...Option) *AppError {
	return newAppError(msg, 502, BlameExternal, opts) //nolint:mnd // HTTP 502
}
