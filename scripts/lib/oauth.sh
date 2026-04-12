#!/usr/bin/env bash
# OAuth setup: GitHub and Google. Opens browser, prompts user to paste credentials.
# Both providers are independently skippable — the auth server handles missing OAuth gracefully.

run_oauth() {
  step "Setting up OAuth providers"

  if is_step_done "oauth"; then
    success "OAuth already configured (skipping)"
    return 0
  fi

  local app_url
  app_url=$(env_get "NEXT_PUBLIC_APP_URL")
  app_url="${app_url:-http://localhost:3000}"

  # ─── GitHub OAuth ───────────────────────────────────────────
  echo ""
  if confirm "Set up GitHub OAuth?" "Y"; then
    info "Opening GitHub OAuth App settings..."
    open_url "https://github.com/settings/developers"
    echo ""
    info "Create a new OAuth App with these settings:"
    echo -e "  ${BOLD}Application name:${RESET}          FullStack Template (Dev)"
    echo -e "  ${BOLD}Homepage URL:${RESET}              $app_url"
    echo -e "  ${BOLD}Authorization callback:${RESET}    $app_url/api/auth/callback/github"
    echo ""

    local gh_client_id gh_client_secret
    gh_client_id=$(prompt_secret "Paste your GitHub Client ID")
    gh_client_secret=$(prompt_secret "Paste your GitHub Client Secret")

    if [ -n "$gh_client_id" ] && [ -n "$gh_client_secret" ]; then
      env_set "GITHUB_CLIENT_ID" "$gh_client_id"
      env_set "GITHUB_CLIENT_SECRET" "$gh_client_secret"
      success "GitHub OAuth configured"
    else
      warn "Skipped GitHub OAuth (empty credentials)"
    fi
  else
    info "Skipping GitHub OAuth"
  fi

  # ─── Google OAuth ───────────────────────────────────────────
  echo ""
  if confirm "Set up Google OAuth?" "Y"; then
    info "Opening Google Cloud Console..."
    open_url "https://console.cloud.google.com/apis/credentials"
    echo ""
    info "Create an OAuth 2.0 Client ID with these settings:"
    echo -e "  ${BOLD}Application type:${RESET}          Web application"
    echo -e "  ${BOLD}Name:${RESET}                      FullStack Template (Dev)"
    echo -e "  ${BOLD}Authorized JS origins:${RESET}     $app_url"
    echo -e "  ${BOLD}Authorized redirect URI:${RESET}   $app_url/api/auth/callback/google"
    echo ""
    info "Note: You may need to configure the OAuth consent screen first."
    echo ""

    local google_client_id google_client_secret
    google_client_id=$(prompt_secret "Paste your Google Client ID")
    google_client_secret=$(prompt_secret "Paste your Google Client Secret")

    if [ -n "$google_client_id" ] && [ -n "$google_client_secret" ]; then
      env_set "GOOGLE_CLIENT_ID" "$google_client_id"
      env_set "GOOGLE_CLIENT_SECRET" "$google_client_secret"
      success "Google OAuth configured"
    else
      warn "Skipped Google OAuth (empty credentials)"
    fi
  else
    info "Skipping Google OAuth"
  fi

  mark_step_done "oauth"
}
