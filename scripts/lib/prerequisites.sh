#!/usr/bin/env bash
# Check for required CLIs and offer to install missing ones via brew.

run_prerequisites() {
  step "Checking prerequisites"

  if is_step_done "prerequisites"; then
    success "Prerequisites already verified (skipping)"
    return 0
  fi

  local missing_required=()
  local missing_optional=()

  # --- Required tools ------------------------------------------
  for cmd in pnpm docker openssl jq; do
    if command -v "$cmd" &>/dev/null; then
      success "$cmd found"
    else
      missing_required+=("$cmd")
      warn "$cmd not found (required)"
    fi
  done

  # Check docker compose (v2 plugin)
  if command -v docker &>/dev/null; then
    if docker compose version &>/dev/null; then
      success "docker compose found"
    else
      missing_required+=("docker-compose")
      warn "docker compose not found (required)"
    fi
  fi

  # --- Optional tools -----------------------------------------
  if ! command -v stripe &>/dev/null; then
    missing_optional+=("stripe")
    warn "stripe CLI not found (needed for Stripe setup)"
  else
    success "stripe CLI found"
  fi

  if ! command -v gh &>/dev/null; then
    missing_optional+=("gh")
    warn "gh CLI not found (useful for GitHub OAuth)"
  else
    success "gh CLI found"
  fi

  if ! command -v aws &>/dev/null; then
    missing_optional+=("awscli")
    warn "aws CLI not found (needed for AWS setup)"
  else
    success "aws CLI found"
  fi

  # --- Install missing required tools -------------------------
  if [ ${#missing_required[@]} -gt 0 ]; then
    if ! command -v brew &>/dev/null; then
      error "Homebrew is required to install missing tools: ${missing_required[*]}"
      error "Install it from https://brew.sh"
      return 1
    fi

    echo ""
    info "Missing required tools: ${missing_required[*]}"
    if confirm "Install them with brew?"; then
      for tool in "${missing_required[@]}"; do
        info "Installing $tool..."
        case "$tool" in
          pnpm)       brew install pnpm ;;
          docker)     error "Install Docker Desktop from https://docker.com/products/docker-desktop"; return 1 ;;
          openssl)    brew install openssl ;;
          jq)         brew install jq ;;
          docker-compose) error "Docker Compose requires Docker Desktop. Install from https://docker.com"; return 1 ;;
        esac
      done
    else
      error "Cannot continue without required tools."
      return 1
    fi
  fi

  # --- Offer to install optional tools ------------------------
  if [ ${#missing_optional[@]} -gt 0 ]; then
    echo ""
    info "Missing optional tools: ${missing_optional[*]}"
    if confirm "Install them with brew?" "Y"; then
      for tool in "${missing_optional[@]}"; do
        info "Installing $tool..."
        case "$tool" in
          stripe)  brew install stripe/stripe-cli/stripe ;;
          gh)      brew install gh ;;
          awscli)  brew install awscli ;;
        esac
      done
    fi
  fi

  mark_step_done "prerequisites"
  success "All prerequisites satisfied"
}
