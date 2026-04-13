package apperrors

import (
	"errors"
	"fmt"
	"testing"
)

func TestClientErrorDefaults(t *testing.T) {
	err := ClientError("bad request")
	if err.StatusCode != 400 {
		t.Fatalf("expected 400, got %d", err.StatusCode)
	}
	if err.Blame != BlameClient {
		t.Fatalf("expected BlameClient, got %s", err.Blame)
	}
	if err.Message != "bad request" {
		t.Fatalf("expected 'bad request', got %q", err.Message)
	}
	if err.UserMessage != "bad request" {
		t.Fatalf("expected UserMessage 'bad request', got %q", err.UserMessage)
	}
	if err.Error() != "bad request" {
		t.Fatalf("expected Error() 'bad request', got %q", err.Error())
	}
}

func TestServerErrorDefaults(t *testing.T) {
	err := ServerError("internal failure")
	if err.StatusCode != 500 {
		t.Fatalf("expected 500, got %d", err.StatusCode)
	}
	if err.Blame != BlameServer {
		t.Fatalf("expected BlameServer, got %s", err.Blame)
	}
}

func TestExternalServiceErrorDefaults(t *testing.T) {
	err := ExternalServiceError("upstream timeout")
	if err.StatusCode != 502 {
		t.Fatalf("expected 502, got %d", err.StatusCode)
	}
	if err.Blame != BlameExternal {
		t.Fatalf("expected BlameExternal, got %s", err.Blame)
	}
}

func TestWithStatusCode(t *testing.T) {
	err := ClientError("not found", WithStatusCode(404))
	if err.StatusCode != 404 {
		t.Fatalf("expected 404, got %d", err.StatusCode)
	}
}

func TestWithCause(t *testing.T) {
	cause := fmt.Errorf("connection refused")
	err := ExternalServiceError("database failed", WithCause(cause))

	if err.Unwrap() != cause {
		t.Fatal("Unwrap did not return the cause")
	}
	if err.Error() != "database failed: connection refused" {
		t.Fatalf("unexpected Error(): %q", err.Error())
	}
}

func TestWithUserMessage(t *testing.T) {
	err := ServerError("null pointer at line 42", WithUserMessage("Something went wrong"))
	if err.UserMessage != "Something went wrong" {
		t.Fatalf("expected user message 'Something went wrong', got %q", err.UserMessage)
	}
	if err.Message != "null pointer at line 42" {
		t.Fatalf("expected internal message preserved, got %q", err.Message)
	}
}

func TestErrorsIs(t *testing.T) {
	cause := fmt.Errorf("root cause")
	err := ServerError("wrapped", WithCause(cause))

	if !errors.Is(err, cause) {
		t.Fatal("errors.Is should find the cause through Unwrap")
	}
}

func TestErrorsAs(t *testing.T) {
	err := ClientError("validation failed")

	var appErr *AppError
	if !errors.As(err, &appErr) {
		t.Fatal("errors.As should match *AppError")
	}
	if appErr.Blame != BlameClient {
		t.Fatalf("expected BlameClient, got %s", appErr.Blame)
	}
}

func TestMultipleOptions(t *testing.T) {
	cause := fmt.Errorf("timeout")
	err := ExternalServiceError(
		"api call failed",
		WithStatusCode(504),
		WithCause(cause),
		WithUserMessage("Please try again later"),
	)

	if err.StatusCode != 504 {
		t.Fatalf("expected 504, got %d", err.StatusCode)
	}
	if err.UserMessage != "Please try again later" {
		t.Fatalf("unexpected user message: %q", err.UserMessage)
	}
	if err.Unwrap() != cause {
		t.Fatal("cause not preserved")
	}
}

func TestErrorWithoutCause(t *testing.T) {
	err := ServerError("simple error")
	if err.Unwrap() != nil {
		t.Fatal("expected nil cause")
	}
}
