#!/usr/bin/env bash
# Prompt-and-paste for optional API keys that have no CLI automation.

run_optional() {
  step "Optional API keys"

  if is_step_done "optional"; then
    success "Optional keys already configured (skipping)"
    return 0
  fi

  info "These are all optional. Press Enter to skip any you don't need yet."
  echo ""

  # ─── Resend (email for SaaS/Vercel mode) ────────────────────
  if confirm "Set up Resend (email API for Vercel deploy)?" "n"; then
    open_url "https://resend.com/api-keys"
    local resend_key
    resend_key=$(prompt_secret "Paste your Resend API key")
    [ -n "$resend_key" ] && env_set "RESEND_API_KEY" "$resend_key"
  fi

  # ─── PostHog (analytics) ────────────────────────────────────
  echo ""
  if confirm "Set up PostHog analytics?" "n"; then
    open_url "https://us.posthog.com/settings/project"
    local posthog_key
    posthog_key=$(prompt_secret "Paste your PostHog project API key")
    [ -n "$posthog_key" ] && env_set "NEXT_PUBLIC_POSTHOG_KEY" "$posthog_key"
  fi

  # ─── OpenAI ─────────────────────────────────────────────────
  echo ""
  if confirm "Set up OpenAI API?" "n"; then
    open_url "https://platform.openai.com/api-keys"
    local openai_key
    openai_key=$(prompt_secret "Paste your OpenAI API key")
    [ -n "$openai_key" ] && env_set "OPENAI_API_KEY" "$openai_key"
  fi

  # ─── Anthropic ──────────────────────────────────────────────
  echo ""
  if confirm "Set up Anthropic API?" "n"; then
    open_url "https://console.anthropic.com/settings/keys"
    local anthropic_key
    anthropic_key=$(prompt_secret "Paste your Anthropic API key")
    [ -n "$anthropic_key" ] && env_set "ANTHROPIC_API_KEY" "$anthropic_key"
  fi

  # ─── Cloudflare ─────────────────────────────────────────────
  echo ""
  if confirm "Set up Cloudflare?" "n"; then
    # Try wrangler for zone ID
    if command -v wrangler &>/dev/null; then
      if wrangler whoami &>/dev/null 2>&1; then
        info "Listing Cloudflare zones..."
        wrangler zones list 2>/dev/null || true
      else
        info "Wrangler not authenticated. Run 'wrangler login' first, or paste values manually."
      fi
    fi

    open_url "https://dash.cloudflare.com/profile/api-tokens"
    local cf_zone cf_token
    cf_zone=$(prompt_value "Cloudflare Zone ID" "")
    cf_token=$(prompt_secret "Cloudflare API Token")
    [ -n "$cf_zone" ] && env_set "CLOUDFLARE_ZONE_ID" "$cf_zone"
    [ -n "$cf_token" ] && env_set "CLOUDFLARE_API_TOKEN" "$cf_token"
  fi

  # ─── Google Site Verification ───────────────────────────────
  echo ""
  if confirm "Set up Google Site Verification?" "n"; then
    open_url "https://search.google.com/search-console"
    local gsv
    gsv=$(prompt_value "Google Site Verification code" "")
    [ -n "$gsv" ] && env_set "GOOGLE_SITE_VERIFICATION" "$gsv"
  fi

  mark_step_done "optional"
  success "Optional keys configured"
}
