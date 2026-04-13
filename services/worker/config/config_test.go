package config

import (
	"testing"
	"time"
)

func TestLoadDefaults(t *testing.T) {
	t.Setenv(envDatabaseURL, "")
	t.Setenv(envHealthAddr, "")
	t.Setenv(envHeartbeatInterval, "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.DatabaseURL != "" {
		t.Fatalf("expected empty DatabaseURL, got %q", cfg.DatabaseURL)
	}
	if cfg.HealthAddr != defaultHealthAddr {
		t.Fatalf("expected HealthAddr %q, got %q", defaultHealthAddr, cfg.HealthAddr)
	}
	if cfg.HeartbeatInterval != defaultHeartbeatInterval {
		t.Fatalf("expected HeartbeatInterval %v, got %v", defaultHeartbeatInterval, cfg.HeartbeatInterval)
	}
}

func TestLoadWithDatabaseURL(t *testing.T) {
	t.Setenv(envDatabaseURL, "postgres://localhost:5432/testdb")
	t.Setenv(envHealthAddr, "")
	t.Setenv(envHeartbeatInterval, "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.DatabaseURL != "postgres://localhost:5432/testdb" {
		t.Fatalf("expected DatabaseURL postgres://localhost:5432/testdb, got %q", cfg.DatabaseURL)
	}
}

func TestLoadWithCustomHealthAddr(t *testing.T) {
	t.Setenv(envDatabaseURL, "")
	t.Setenv(envHealthAddr, ":9090")
	t.Setenv(envHeartbeatInterval, "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.HealthAddr != ":9090" {
		t.Fatalf("expected HealthAddr :9090, got %q", cfg.HealthAddr)
	}
}

func TestLoadWithCustomHeartbeatInterval(t *testing.T) {
	t.Setenv(envDatabaseURL, "")
	t.Setenv(envHealthAddr, "")
	t.Setenv(envHeartbeatInterval, "10s")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.HeartbeatInterval != 10*time.Second {
		t.Fatalf("expected HeartbeatInterval 10s, got %v", cfg.HeartbeatInterval)
	}
}

func TestLoadInvalidHeartbeatInterval(t *testing.T) {
	t.Setenv(envDatabaseURL, "")
	t.Setenv(envHealthAddr, "")
	t.Setenv(envHeartbeatInterval, "notaduration")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for invalid HEARTBEAT_INTERVAL, got nil")
	}
}

func TestLoadNegativeHeartbeatInterval(t *testing.T) {
	t.Setenv(envDatabaseURL, "")
	t.Setenv(envHealthAddr, "")
	t.Setenv(envHeartbeatInterval, "-5s")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for negative HEARTBEAT_INTERVAL, got nil")
	}
}

func TestLoadZeroHeartbeatInterval(t *testing.T) {
	t.Setenv(envDatabaseURL, "")
	t.Setenv(envHealthAddr, "")
	t.Setenv(envHeartbeatInterval, "0s")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for zero HEARTBEAT_INTERVAL, got nil")
	}
}
