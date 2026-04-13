// Package config validates and provides typed access to environment variables.
// This is the only package allowed to call os.Getenv.
package config

import (
	"errors"
	"fmt"
	"os"
	"time"
)

var errInvalidConfig = errors.New("invalid configuration")

const (
	defaultHealthAddr        = ":8080"
	defaultHeartbeatInterval = 30 * time.Second
	envDatabaseURL           = "DATABASE_URL"
	envHealthAddr            = "HEALTH_ADDR"
	envHeartbeatInterval     = "HEARTBEAT_INTERVAL"
)

// Config holds validated application configuration.
type Config struct {
	DatabaseURL       string
	HealthAddr        string
	HeartbeatInterval time.Duration
}

// Load reads environment variables, applies defaults, and returns a validated Config.
func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL:       os.Getenv(envDatabaseURL),
		HealthAddr:        defaultHealthAddr,
		HeartbeatInterval: defaultHeartbeatInterval,
	}

	if v := os.Getenv(envHealthAddr); v != "" {
		cfg.HealthAddr = v
	}

	if v := os.Getenv(envHeartbeatInterval); v != "" {
		d, err := time.ParseDuration(v)
		if err != nil {
			return nil, fmt.Errorf("invalid %s %q: %w", envHeartbeatInterval, v, err)
		}
		if d <= 0 {
			return nil, fmt.Errorf("%w: %s must be positive, got %s", errInvalidConfig, envHeartbeatInterval, v)
		}
		cfg.HeartbeatInterval = d
	}

	return cfg, nil
}
