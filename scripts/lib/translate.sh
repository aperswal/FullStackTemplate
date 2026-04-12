#!/usr/bin/env bash
# Setup Google Cloud Translation API key — automates via gcloud CLI when available.

run_translate() {
  step "Translation API (i18n auto-translation)"

  if is_step_done "translate"; then
    success "Translation API already configured (skipping)"
    return 0
  fi

  info "This configures the API key used by 'pnpm translate' to auto-translate"
  info "your i18n message files to other languages."
  echo ""

  if ! confirm "Set up translation API?" "n"; then
    info "Skipping translation setup. Run ./scripts/setup.sh later to configure."
    mark_step_done "translate"
    return 0
  fi

  echo ""
  echo "  1) Google Cloud Translation (free 500K chars/month)"
  echo "  2) DeepL (free tier: 500K chars/month, higher quality)"
  echo "  3) Skip — I'll set the key manually"
  echo -en "${BOLD}Choose provider [1/2/3]:${RESET} "
  read -r provider_choice

  case "$provider_choice" in
    1) _setup_google_translate ;;
    2) _setup_deepl ;;
    *)
      info "Skipping. Set GOOGLE_TRANSLATE_API_KEY or DEEPL_API_KEY in .env manually."
      ;;
  esac

  # ─── Configure target languages ──────────────────────────────
  echo ""
  info "Which languages should translations be generated for?"
  info "Enter ISO codes separated by commas (e.g., es,fr,de,ja,zh,ko)"
  info "Common codes: es (Spanish), fr (French), de (German), ja (Japanese),"
  info "              zh (Chinese), ko (Korean), pt (Portuguese), it (Italian)"
  echo ""
  local target_langs
  target_langs=$(prompt_value "Target languages" "")

  if [ -n "$target_langs" ]; then
    # Convert comma-separated to JSON array
    local json_array
    json_array=$(echo "$target_langs" | tr -d ' ' | tr ',' '\n' | sed 's/.*/"&"/' | paste -sd, - | sed 's/^/[/' | sed 's/$/]/')

    local config_file="$PROJECT_ROOT/apps/web/i18n.config.json"
    if [ -f "$config_file" ]; then
      # Update targetLocales in config
      node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('$config_file', 'utf8'));
        config.targetLocales = $json_array;
        fs.writeFileSync('$config_file', JSON.stringify(config, null, 2) + '\n');
      "
      success "Updated i18n.config.json with target locales: $target_langs"
    fi
  fi

  mark_step_done "translate"
  success "Translation API configured"
}

_setup_google_translate() {
  # ─── Try gcloud CLI automation ────────────────────────────────
  if command -v gcloud &>/dev/null; then
    info "Found gcloud CLI. Attempting automated setup..."

    # Check if logged in
    if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>/dev/null | head -1 | grep -q "@"; then
      warn "gcloud not authenticated."
      info "Run: gcloud auth login"
      echo ""
      if confirm "Open gcloud login now?" "Y"; then
        gcloud auth login 2>/dev/null || true
      fi
    fi

    local project
    project=$(gcloud config get-value project 2>/dev/null || echo "")

    if [ -z "$project" ]; then
      warn "No gcloud project set."
      local projects
      projects=$(gcloud projects list --format="value(projectId)" 2>/dev/null | head -10)
      if [ -n "$projects" ]; then
        echo ""
        info "Your projects:"
        echo "$projects" | sed 's/^/    /'
        echo ""
        project=$(prompt_value "Enter project ID to use" "")
        if [ -n "$project" ]; then
          gcloud config set project "$project" 2>/dev/null
        fi
      fi
    fi

    if [ -n "$project" ]; then
      info "Using project: $project"

      # Enable the Translation API
      info "Enabling Cloud Translation API..."
      if gcloud services enable translate.googleapis.com 2>/dev/null; then
        success "Cloud Translation API enabled"
      else
        warn "Could not enable API (may need billing). Enable manually at:"
        info "https://console.cloud.google.com/apis/library/translate.googleapis.com"
      fi

      # Create API key
      if confirm "Create a new API key for translation?" "Y"; then
        info "Creating API key..."
        local key_output
        key_output=$(gcloud services api-keys create \
          --display-name="i18n-translation" \
          --api-target=service=translate.googleapis.com \
          --format="value(response.keyString)" 2>/dev/null || echo "")

        if [ -n "$key_output" ]; then
          env_set "GOOGLE_TRANSLATE_API_KEY" "$key_output"
          success "API key created and saved"
          return 0
        else
          warn "Could not create API key via CLI. Falling back to manual entry."
        fi
      fi
    fi
  else
    info "gcloud CLI not found. You can install it from: https://cloud.google.com/sdk/docs/install"
    echo ""
  fi

  # ─── Manual fallback ──────────────────────────────────────────
  info "To get a Google Cloud Translation API key:"
  info "  1. Go to https://console.cloud.google.com/apis/credentials"
  info "  2. Create a new API key"
  info "  3. Restrict it to 'Cloud Translation API'"
  echo ""
  open_url "https://console.cloud.google.com/apis/credentials"

  local api_key
  api_key=$(prompt_secret "Paste your Google Cloud Translation API key")
  if [ -n "$api_key" ]; then
    env_set "GOOGLE_TRANSLATE_API_KEY" "$api_key"
    success "API key saved"
  fi
}

_setup_deepl() {
  info "To get a DeepL API key:"
  info "  1. Create a free account at https://www.deepl.com/signup?cta=free-login-signup"
  info "  2. Go to https://www.deepl.com/your-account/keys"
  info "  3. Copy your Authentication Key"
  echo ""
  open_url "https://www.deepl.com/your-account/keys"

  local api_key
  api_key=$(prompt_secret "Paste your DeepL API key")
  if [ -n "$api_key" ]; then
    env_set "DEEPL_API_KEY" "$api_key"

    # Update i18n.config.json provider
    local config_file="$PROJECT_ROOT/apps/web/i18n.config.json"
    if [ -f "$config_file" ]; then
      node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('$config_file', 'utf8'));
        config.provider = 'deepl-free';
        fs.writeFileSync('$config_file', JSON.stringify(config, null, 2) + '\n');
      "
    fi
    success "DeepL API key saved, provider set to deepl-free"
  fi
}
