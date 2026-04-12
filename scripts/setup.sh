#!/usr/bin/env bash
set -uo pipefail

# ─── Resolve paths ─────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export PROJECT_ROOT

# ─── Source shared utilities ───────────────────────────────────
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/prerequisites.sh"
source "$SCRIPT_DIR/lib/local.sh"
source "$SCRIPT_DIR/lib/stripe.sh"
source "$SCRIPT_DIR/lib/aws.sh"
source "$SCRIPT_DIR/lib/oauth.sh"
source "$SCRIPT_DIR/lib/optional.sh"
source "$SCRIPT_DIR/lib/translate.sh"
source "$SCRIPT_DIR/lib/write-env.sh"
source "$SCRIPT_DIR/lib/start-services.sh"

# ─── Parse arguments ──────────────────────────────────────────
FORCE=false
SKIP_SERVICES=false
SKIP_INSTALL=false
ENV_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --force)          FORCE=true ;;
    --skip-services)  SKIP_SERVICES=true ;;
    --skip-install)   SKIP_INSTALL=true ;;
    --env-only)       ENV_ONLY=true ;;
    --help|-h)
      echo "Usage: ./scripts/setup.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --force          Ignore previous state, re-run everything"
      echo "  --skip-services  Don't start Docker services at the end"
      echo "  --skip-install   Don't install missing CLIs"
      echo "  --env-only       Only write .env from existing state (skip provisioning)"
      echo "  --help           Show this help"
      exit 0
      ;;
  esac
done

# ─── Cleanup trap ─────────────────────────────────────────────
SETUP_COMPLETED=false

cleanup() {
  if [ "$SETUP_COMPLETED" = "false" ]; then
    echo ""
    warn "Setup did not complete. Re-run ./scripts/setup.sh to resume."
    echo ""
    info "Step status:"
    for s in prerequisites local stripe aws oauth optional translate env services; do
      if is_step_done "$s"; then
        echo -e "  ${GREEN}done${RESET}  $s"
      else
        echo -e "  ${YELLOW}  --${RESET}  $s"
      fi
    done
  fi

  # Clean up temp accumulator
  rm -f "$ENV_ACCUMULATOR" 2>/dev/null
}
trap cleanup EXIT

# ─── Initialize ───────────────────────────────────────────────
banner

if [ "$FORCE" = "true" ]; then
  info "Force mode: ignoring previous state"
  rm -f "$STATE_FILE"
fi

state_init
env_init

# ─── Check for existing .setup-state ─────────────────────────
if [ -f "$STATE_FILE" ] && [ "$FORCE" != "true" ]; then
  local_done=0
  for s in prerequisites local stripe aws oauth optional env services; do
    is_step_done "$s" && local_done=$((local_done + 1))
  done

  if [ $local_done -gt 0 ]; then
    info "Found previous setup state ($local_done/9 steps completed)."
    if confirm "Resume from where you left off?" "Y"; then
      info "Resuming..."
    else
      if confirm "Start fresh (reset all state)?" "n"; then
        rm -f "$STATE_FILE"
        state_init
        info "State cleared. Starting fresh."
      else
        info "Aborting."
        SETUP_COMPLETED=true
        exit 0
      fi
    fi
  fi
fi

# ─── Run setup steps ─────────────────────────────────────────

if [ "$ENV_ONLY" = "true" ]; then
  # Just write the .env from whatever state exists
  run_write_env
  SETUP_COMPLETED=true
  exit 0
fi

# 1. Prerequisites
if [ "$SKIP_INSTALL" != "true" ]; then
  run_prerequisites
fi

# 2. Local secrets and defaults
run_local

# 3. Stripe
if confirm "Set up Stripe payments?" "Y"; then
  run_stripe
else
  info "Skipping Stripe. Set STRIPE_* vars manually in .env"
  env_set "STRIPE_SECRET_KEY" "sk_test_placeholder"
  env_set "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "pk_test_placeholder"
  env_set "STRIPE_WEBHOOK_SECRET" "whsec_placeholder"
  env_set "STRIPE_PRO_PRICE_ID" ""
  mark_step_done "stripe"
fi

# 4. AWS
if confirm "Set up AWS (S3 storage, IAM)?" "Y"; then
  run_aws
else
  info "Skipping AWS"
  mark_step_done "aws"
fi

# 5. OAuth
run_oauth

# 6. Optional APIs
run_optional

# 6b. Translation
run_translate

# 7. Write .env
run_write_env

# 8. Start services
if [ "$SKIP_SERVICES" != "true" ]; then
  echo ""
  if confirm "Start Docker services and run migrations?" "Y"; then
    run_start_services
  else
    info "Skipping services. Start them manually with:"
    echo "  docker compose up -d db mailpit"
    echo "  pnpm install"
    echo "  cd apps/web && npx drizzle-kit migrate"
    mark_step_done "services"
  fi
else
  info "Skipping services (--skip-services)"
  mark_step_done "services"
fi

# ─── Done ─────────────────────────────────────────────────────
SETUP_COMPLETED=true

echo ""
echo -e "${BOLD}${GREEN}"
echo "  ┌─────────────────────────────────────────┐"
echo "  │            Setup complete!               │"
echo "  └─────────────────────────────────────────┘"
echo -e "${RESET}"
echo "  Next steps:"
echo ""
echo -e "  ${BOLD}1.${RESET} Start the dev server:"
echo "     pnpm dev"
echo ""
echo -e "  ${BOLD}2.${RESET} Open the app:"
echo "     $(env_get 'NEXT_PUBLIC_APP_URL' || echo 'http://localhost:3000')"
echo ""
echo -e "  ${BOLD}3.${RESET} Mailpit (dev email):"
echo "     http://localhost:8025"
echo ""

if command -v stripe &>/dev/null && [ "$(env_get 'STRIPE_WEBHOOK_SECRET')" != "whsec_placeholder" ]; then
  echo -e "  ${BOLD}4.${RESET} Stripe webhooks (run in a separate terminal):"
  echo "     stripe listen --forward-to localhost:3000/api/webhooks/stripe"
  echo ""
fi
