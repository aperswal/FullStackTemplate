#!/usr/bin/env bash
# Start Docker services (db + mailpit), install deps, run migrations, optionally seed.

run_start_services() {
  step "Starting services"

  if is_step_done "services"; then
    success "Services already started (skipping)"
    if confirm "Start them again anyway?" "n"; then
      : # fall through
    else
      return 0
    fi
  fi

  # ─── Check ports ────────────────────────────────────────────
  if is_port_in_use 5432; then
    warn "Port 5432 is already in use. Postgres may already be running."
    if ! confirm "Continue anyway?" "Y"; then
      return 0
    fi
  fi

  if is_port_in_use 1025; then
    warn "Port 1025 is already in use. Mailpit may already be running."
  fi

  # ─── Start Docker services ─────────────────────────────────
  info "Starting database and mail services..."
  cd "$PROJECT_ROOT" || return 1
  docker compose up -d db mailpit

  # Wait for Postgres to be ready
  info "Waiting for Postgres to be ready..."
  local retries=30
  while [ $retries -gt 0 ]; do
    if docker compose exec -T db pg_isready -U postgres &>/dev/null; then
      success "Postgres is ready"
      break
    fi
    retries=$((retries - 1))
    sleep 1
  done

  if [ $retries -eq 0 ]; then
    error "Postgres did not become ready in time."
    error "Check: docker compose logs db"
    return 1
  fi

  # ─── Install dependencies ───────────────────────────────────
  if [ ! -d "$PROJECT_ROOT/node_modules" ] || [ ! -d "$PROJECT_ROOT/apps/web/node_modules" ]; then
    info "Installing Node dependencies..."
    pnpm install
  else
    success "Node dependencies already installed"
  fi

  # ─── Run migrations ────────────────────────────────────────
  info "Running database migrations..."
  cd "$PROJECT_ROOT/apps/web" || return 1

  if npx drizzle-kit migrate 2>&1; then
    success "Migrations complete"
  else
    error "Migration failed. Check DATABASE_URL in .env"
    return 1
  fi

  cd "$PROJECT_ROOT" || return 1

  # ─── Seed (optional) ───────────────────────────────────────
  echo ""
  if confirm "Seed database with test data (admin@example.com)?" "Y"; then
    info "Seeding database..."
    cd "$PROJECT_ROOT/apps/web" || return 1
    npx tsx lib/db/seed.ts 2>&1 && success "Database seeded" || warn "Seeding failed (may already be seeded)"
    cd "$PROJECT_ROOT" || return 1
  fi

  mark_step_done "services"
  success "Services started"
}
