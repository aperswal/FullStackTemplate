#!/usr/bin/env bash
# Stripe setup: login, extract keys, create product + price, get webhook secret.

run_stripe() {
  step "Setting up Stripe"

  if is_step_done "stripe"; then
    success "Stripe already configured (skipping)"
    return 0
  fi

  if ! command -v stripe &>/dev/null; then
    warn "Stripe CLI not installed. Skipping Stripe setup."
    warn "Install later with: brew install stripe/stripe-cli/stripe"
    env_set "STRIPE_SECRET_KEY" "sk_test_placeholder"
    env_set "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "pk_test_placeholder"
    env_set "STRIPE_WEBHOOK_SECRET" "whsec_placeholder"
    env_set "STRIPE_PRO_PRICE_ID" ""
    return 0
  fi

  # ─── Login ───────────────────────────────────────────────────
  info "Checking Stripe authentication..."
  if ! stripe config --list &>/dev/null; then
    info "Opening Stripe login in your browser..."
    stripe login
  else
    success "Already logged into Stripe"
  fi

  # ─── API Keys ────────────────────────────────────────────────
  # stripe config --list shows the device name and key info but not raw keys.
  # The most reliable approach is to open the dashboard and prompt.
  info "We need your Stripe test API keys."
  info "Opening Stripe dashboard..."
  open_url "https://dashboard.stripe.com/test/apikeys"
  echo ""

  local sk
  sk=$(prompt_secret "Paste your Secret key (sk_test_...)")
  if [[ ! "$sk" =~ ^sk_test_ ]]; then
    warn "Key doesn't start with sk_test_ — are you sure this is a test key?"
    if ! confirm "Continue anyway?" "n"; then
      return 1
    fi
  fi
  env_set "STRIPE_SECRET_KEY" "$sk"

  local pk
  pk=$(prompt_secret "Paste your Publishable key (pk_test_...)")
  env_set "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$pk"

  # ─── Create Product + Price ─────────────────────────────────
  local price_id
  price_id=$(state_get "STRIPE_PRO_PRICE_ID")

  if [ -n "$price_id" ]; then
    info "Reusing previously created price: $price_id"
  else
    info "Creating Pro Plan product and price..."

    local product_id
    product_id=$(stripe products create \
      --name="Pro Plan" \
      --description="Professional plan - unlimited projects, priority support" \
      -d "metadata[app]=fullstack-template" \
      --api-key="$sk" \
      2>/dev/null | grep '"id":' | head -1 | sed 's/.*"id": "\(.*\)".*/\1/')

    if [ -z "$product_id" ]; then
      error "Failed to create Stripe product. Creating with JSON output..."
      product_id=$(stripe products create \
        --name="Pro Plan" \
        --description="Professional plan - unlimited projects, priority support" \
        -d "metadata[app]=fullstack-template" \
        --api-key="$sk" \
        --format=json 2>/dev/null | jq -r '.id')
    fi

    if [ -z "$product_id" ] || [ "$product_id" = "null" ]; then
      error "Could not create Stripe product."
      price_id=$(prompt_value "Paste a Price ID manually (or leave blank)" "")
    else
      success "Created product: $product_id"
      state_set "STRIPE_PRODUCT_ID" "$product_id"

      price_id=$(stripe prices create \
        --product="$product_id" \
        --unit-amount=2900 \
        --currency=usd \
        -d "recurring[interval]=month" \
        --api-key="$sk" \
        --format=json 2>/dev/null | jq -r '.id')

      if [ -z "$price_id" ] || [ "$price_id" = "null" ]; then
        error "Could not create Stripe price."
        price_id=$(prompt_value "Paste a Price ID manually (or leave blank)" "")
      else
        success "Created price: $price_id ($29/month)"
      fi
    fi

    [ -n "$price_id" ] && state_set "STRIPE_PRO_PRICE_ID" "$price_id"
  fi

  env_set "STRIPE_PRO_PRICE_ID" "$price_id"

  # ─── Webhook Secret ─────────────────────────────────────────
  info "Getting webhook signing secret..."
  local webhook_secret
  webhook_secret=$(stripe listen --print-secret --api-key="$sk" 2>/dev/null)

  if [ -n "$webhook_secret" ] && [[ "$webhook_secret" =~ ^whsec_ ]]; then
    env_set "STRIPE_WEBHOOK_SECRET" "$webhook_secret"
    success "Got webhook secret"
  else
    warn "Could not get webhook secret automatically."
    webhook_secret=$(prompt_secret "Paste webhook secret (whsec_...) or run 'stripe listen' later")
    if [ -n "$webhook_secret" ]; then
      env_set "STRIPE_WEBHOOK_SECRET" "$webhook_secret"
    else
      env_set "STRIPE_WEBHOOK_SECRET" "whsec_placeholder"
    fi
  fi

  echo ""
  info "During development, run in a separate terminal:"
  echo -e "  ${DIM}stripe listen --forward-to localhost:3000/api/webhooks/stripe${RESET}"
  echo ""

  mark_step_done "stripe"
  success "Stripe configured"
}
