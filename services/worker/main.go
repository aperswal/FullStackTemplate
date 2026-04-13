// Package main implements a background worker with health checking and database heartbeat.
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/your-org/template/services/worker/apperrors"
	"github.com/your-org/template/services/worker/config"

	_ "github.com/lib/pq"
)

func newHealthMux() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", healthHandler)
	return mux
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"status": "healthy"}); err != nil {
		slog.Error("failed to encode health response", "error", err)
	}
}

var sqlDriver = "postgres"

func connectDB(dbURL string) (*sql.DB, error) {
	db, err := sql.Open(sqlDriver, dbURL)
	if err != nil {
		return nil, apperrors.ExternalServiceError("database open failed", apperrors.WithCause(err))
	}
	if err = db.Ping(); err != nil {
		_ = db.Close()
		return nil, apperrors.ExternalServiceError("database ping failed", apperrors.WithCause(err))
	}
	return db, nil
}

func heartbeat(db *sql.DB) {
	if db != nil {
		if err := db.Ping(); err != nil {
			slog.Error("heartbeat: database ping failed", "error", err)
		} else {
			slog.Info("heartbeat: ok")
		}
	} else {
		slog.Info("heartbeat: ok (no database)")
	}
}

func runWorker(ctx context.Context, db *sql.DB, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			heartbeat(db)
		case <-ctx.Done():
			return
		}
	}
}

func startHealthServer(listener net.Listener) *http.Server {
	server := &http.Server{
		Handler:           newHealthMux(),
		ReadHeaderTimeout: 10 * time.Second, //nolint:mnd // standard timeout for health server
	}
	go func() {
		if err := server.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("health server failed", "error", err)
		}
	}()
	return server
}

func run(ctx context.Context, cfg *config.Config) error {
	var db *sql.DB
	if cfg.DatabaseURL != "" {
		var err error
		db, err = connectDB(cfg.DatabaseURL)
		if err != nil {
			return err
		}
		defer func() { _ = db.Close() }()
		slog.Info("database connection established")
	} else {
		slog.Warn("DATABASE_URL not set, running without database connection")
	}

	listener, err := net.Listen("tcp", cfg.HealthAddr)
	if err != nil {
		return apperrors.ServerError("health server listen failed", apperrors.WithCause(err))
	}
	server := startHealthServer(listener)
	defer func() { _ = server.Shutdown(context.Background()) }()

	slog.Info("worker ready", "interval", cfg.HeartbeatInterval.String())
	runWorker(ctx, db, cfg.HeartbeatInterval)
	return nil
}

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		return
	}

	if err := run(ctx, cfg); err != nil {
		slog.Error("worker failed", "error", err)
	}
}
