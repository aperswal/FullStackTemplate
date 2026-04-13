package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"syscall"
	"testing"
	"time"

	"github.com/your-org/template/services/worker/config"
)

func TestHealthEndpoint(t *testing.T) {
	mux := newHealthMux()
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	contentType := rec.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %s", contentType)
	}

	var body map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response body: %v", err)
	}

	if body["status"] != "healthy" {
		t.Fatalf("expected status healthy, got %s", body["status"])
	}
}

func TestHealthEndpointNotFound(t *testing.T) {
	mux := newHealthMux()
	req := httptest.NewRequest(http.MethodGet, "/other", nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rec.Code)
	}
}

func TestHealthEndpointMethod(t *testing.T) {
	mux := newHealthMux()
	req := httptest.NewRequest(http.MethodPost, "/healthz", nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 for POST, got %d", rec.Code)
	}
}

// errorWriter always returns an error when written to, triggering the healthHandler encode error.
type errorWriter struct{ http.ResponseWriter }

func (e errorWriter) Write([]byte) (int, error) {
	return 0, fmt.Errorf("simulated write error")
}

func TestHealthHandlerEncodeError(_ *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	ew := errorWriter{rec}
	healthHandler(ew, req)
}

func TestConnectDBFailsWithInvalidURL(t *testing.T) {
	_, err := connectDB("postgres://invalid:5432/nonexistent?connect_timeout=1")
	if err == nil {
		t.Fatal("expected error connecting to invalid database, got nil")
	}
}

func TestConnectDBOpenFailure(t *testing.T) {
	_, err := connectDB("://bad")
	if err == nil {
		t.Fatal("expected error for malformed DSN, got nil")
	}
}

func TestHeartbeatWithNilDB(_ *testing.T) {
	heartbeat(nil)
}

func TestHeartbeatWithInvalidDB(t *testing.T) {
	db, err := sql.Open("postgres", "postgres://invalid:5432/nonexistent?connect_timeout=1")
	if err != nil {
		t.Skipf("could not create db handle: %v", err)
	}
	defer func() { _ = db.Close() }()
	heartbeat(db)
}

func TestHeartbeatWithValidDB(t *testing.T) {
	db, err := sql.Open("fakedb", "ok")
	if err != nil {
		t.Fatalf("failed to open fakedb: %v", err)
	}
	defer func() { _ = db.Close() }()
	heartbeat(db)
}

func TestRunWorkerStopsOnContextCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan struct{})
	go func() {
		runWorker(ctx, nil, 50*time.Millisecond)
		close(done)
	}()

	time.Sleep(80 * time.Millisecond)
	cancel()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("runWorker did not stop after context cancellation")
	}
}

func TestStartHealthServer(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to create listener: %v", err)
	}
	port := listener.Addr().(*net.TCPAddr).Port

	server := startHealthServer(listener)
	defer func() { _ = server.Shutdown(context.Background()) }()

	resp, err := http.Get(fmt.Sprintf("http://127.0.0.1:%d/healthz", port))
	if err != nil {
		t.Fatalf("failed to GET /healthz: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var data map[string]string
	if err := json.Unmarshal(body, &data); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if data["status"] != "healthy" {
		t.Fatalf("expected healthy, got %s", data["status"])
	}
}

func TestStartHealthServerWithClosedListener(_ *testing.T) {
	listener, _ := net.Listen("tcp", "127.0.0.1:0")
	_ = listener.Close()

	server := startHealthServer(listener)
	defer func() { _ = server.Shutdown(context.Background()) }()

	time.Sleep(50 * time.Millisecond)
}

func testConfig(dbURL string, healthAddr string, interval time.Duration) *config.Config {
	return &config.Config{
		DatabaseURL:       dbURL,
		HealthAddr:        healthAddr,
		HeartbeatInterval: interval,
	}
}

func TestRunWithoutDatabase(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan error, 1)
	go func() {
		done <- run(ctx, testConfig("", "127.0.0.1:0", 50*time.Millisecond))
	}()

	time.Sleep(80 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("run returned unexpected error: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("run did not stop after context cancellation")
	}
}

func TestRunWithInvalidDatabase(t *testing.T) {
	ctx := t.Context()

	err := run(ctx, testConfig("postgres://invalid:5432/nonexistent?connect_timeout=1", "127.0.0.1:0", 50*time.Millisecond))
	if err == nil {
		t.Fatal("expected error for invalid database URL, got nil")
	}
}

func TestRunWithFakeDatabase(t *testing.T) {
	origDriver := sqlDriver
	sqlDriver = "fakedb"
	defer func() { sqlDriver = origDriver }()

	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan error, 1)
	go func() {
		done <- run(ctx, testConfig("fakedsn", "127.0.0.1:0", 50*time.Millisecond))
	}()

	time.Sleep(80 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("run returned unexpected error: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("run did not stop after context cancellation")
	}
}

func TestRunWithInvalidListenAddr(t *testing.T) {
	ctx := t.Context()

	err := run(ctx, testConfig("", "invalid-addr-no-port", 50*time.Millisecond))
	if err == nil {
		t.Fatal("expected error for invalid listen address, got nil")
	}
}

func TestConnectDBSuccess(t *testing.T) {
	origDriver := sqlDriver
	sqlDriver = "fakedb"
	defer func() { sqlDriver = origDriver }()

	db, err := connectDB("fakedsn")
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	_ = db.Close()
}

func TestMainFunction(t *testing.T) {
	origDB := os.Getenv("DATABASE_URL")
	_ = os.Unsetenv("DATABASE_URL")
	defer func() { _ = os.Setenv("DATABASE_URL", origDB) }()

	done := make(chan struct{})
	go func() {
		main()
		close(done)
	}()

	time.Sleep(100 * time.Millisecond)
	p, _ := os.FindProcess(os.Getpid())
	_ = p.Signal(syscall.SIGINT)

	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("main() did not exit after SIGINT")
	}
}
