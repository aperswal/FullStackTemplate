#!/usr/bin/env bash
# Generate local secrets and set default env vars that require no external services.

run_local() {
  step "Setting up local environment"

  if is_step_done "local"; then
    success "Local environment already configured (skipping)"
    return 0
  fi

  # Deployment target
  env_set "DEPLOY_TARGET" "docker"
  env_set "SEED_DATABASE" "false"

  # Application URL
  local app_url
  app_url=$(prompt_value "Application URL" "http://localhost:3000")
  env_set "NEXT_PUBLIC_APP_URL" "$app_url"

  # Database (matches docker-compose.yml)
  env_set "DATABASE_URL" "postgresql://postgres:postgres@localhost:5432/template"

  # Auth secret
  local existing_secret
  existing_secret=$(state_get "BETTER_AUTH_SECRET")
  if [ -n "$existing_secret" ]; then
    info "Reusing previously generated auth secret"
    env_set "BETTER_AUTH_SECRET" "$existing_secret"
  else
    local secret
    secret=$(openssl rand -base64 32)
    env_set "BETTER_AUTH_SECRET" "$secret"
    state_set "BETTER_AUTH_SECRET" "$secret"
    success "Generated BETTER_AUTH_SECRET"
  fi
  env_set "BETTER_AUTH_URL" "$app_url"

  # Email (Mailpit from docker-compose for local dev)
  env_set "SMTP_HOST" "localhost"
  env_set "SMTP_PORT" "1025"
  env_set "EMAIL_FROM" "noreply@example.com"

  # AWS defaults
  env_set "AWS_REGION" "us-east-1"

  # PostHog host default
  env_set "NEXT_PUBLIC_POSTHOG_HOST" "https://us.i.posthog.com"

  mark_step_done "local"
  success "Local environment configured"
}
