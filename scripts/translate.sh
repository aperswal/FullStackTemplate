#!/usr/bin/env bash
set -euo pipefail

# ─── Auto-translate i18n messages from en.json to all configured target locales ───
#
# Usage:
#   ./scripts/translate.sh                   # Translate to all configured locales
#   ./scripts/translate.sh --to es,fr        # Translate to specific locales only
#   ./scripts/translate.sh --override        # Re-translate all keys (overwrite manual edits)
#   ./scripts/translate.sh --provider deepl-free  # Use a different provider
#
# Reads config from apps/web/i18n.config.json
# Requires GOOGLE_TRANSLATE_API_KEY in .env (or the provider's key)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/apps/web"
CONFIG_FILE="$WEB_DIR/i18n.config.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${BLUE}[i18n]${RESET} $*"; }
success() { echo -e "${GREEN}[done]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET} $*"; }
error()   { echo -e "${RED}[error]${RESET} $*" >&2; }

# ─── Load .env if present ────────────────────────────────────────
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

# ─── Parse arguments ─────────────────────────────────────────────
OVERRIDE=""
TARGET_OVERRIDE=""
PROVIDER_OVERRIDE=""

for arg in "$@"; do
  case "$arg" in
    --override)       OVERRIDE="--override" ;;
    --to=*)           TARGET_OVERRIDE="${arg#--to=}" ;;
    --to)             shift; TARGET_OVERRIDE="$1" 2>/dev/null || true ;;
    --provider=*)     PROVIDER_OVERRIDE="${arg#--provider=}" ;;
    --provider)       shift; PROVIDER_OVERRIDE="$1" 2>/dev/null || true ;;
    --help|-h)
      echo "Usage: ./scripts/translate.sh [OPTIONS]"
      echo ""
      echo "Translates messages/en.json to all locales in i18n.config.json"
      echo ""
      echo "Options:"
      echo "  --to es,fr,de    Translate to specific locales only (comma-separated)"
      echo "  --override       Re-translate all keys, overwriting manual edits"
      echo "  --provider NAME  Override provider (google-official, deepl-free, deepl-pro)"
      echo "  --help           Show this help"
      echo ""
      echo "Supported providers: google-official, azure-official, deepl-pro, deepl-free"
      echo ""
      echo "Set your API key in .env:"
      echo "  GOOGLE_TRANSLATE_API_KEY=...   (for google-official)"
      echo "  DEEPL_API_KEY=...              (for deepl-pro or deepl-free)"
      exit 0
      ;;
  esac
done

# ─── Read config ─────────────────────────────────────────────────
if [ ! -f "$CONFIG_FILE" ]; then
  error "Config file not found: $CONFIG_FILE"
  exit 1
fi

SOURCE_LOCALE=$(node -e "console.log(require('$CONFIG_FILE').sourceLocale)")
MESSAGES_DIR=$(node -e "console.log(require('$CONFIG_FILE').messagesDir)")
MAX_LINES=$(node -e "console.log(require('$CONFIG_FILE').maxLinesPerRequest || 50)")
CONFIG_PROVIDER=$(node -e "console.log(require('$CONFIG_FILE').provider)")

PROVIDER="${PROVIDER_OVERRIDE:-$CONFIG_PROVIDER}"

# Get target locales from override or config
if [ -n "$TARGET_OVERRIDE" ]; then
  IFS=',' read -ra TARGET_LOCALES <<< "$TARGET_OVERRIDE"
else
  TARGET_LOCALES_JSON=$(node -e "console.log(JSON.stringify(require('$CONFIG_FILE').targetLocales))")
  if [ "$TARGET_LOCALES_JSON" = "[]" ]; then
    warn "No target locales configured in $CONFIG_FILE"
    info "Add languages to targetLocales, e.g.: [\"es\", \"fr\", \"de\", \"ja\"]"
    exit 0
  fi
  readarray -t TARGET_LOCALES < <(node -e "require('$CONFIG_FILE').targetLocales.forEach(l => console.log(l))")
fi

# ─── Resolve API key ────────────────────────────────────────────
API_KEY=""
case "$PROVIDER" in
  google-official)
    API_KEY="${GOOGLE_TRANSLATE_API_KEY:-}"
    ;;
  deepl-pro|deepl-free)
    API_KEY="${DEEPL_API_KEY:-}"
    ;;
  azure-official)
    API_KEY="${AZURE_TRANSLATE_KEY:-}"
    ;;
  *)
    API_KEY="${GOOGLE_TRANSLATE_API_KEY:-}"
    ;;
esac

if [ -z "$API_KEY" ]; then
  error "No API key found for provider '$PROVIDER'"
  echo ""
  case "$PROVIDER" in
    google-official)
      info "Set GOOGLE_TRANSLATE_API_KEY in your .env file"
      info "Run ./scripts/setup.sh to configure it interactively"
      info "Or get one at: https://console.cloud.google.com/apis/credentials"
      ;;
    deepl-pro|deepl-free)
      info "Set DEEPL_API_KEY in your .env file"
      info "Get one at: https://www.deepl.com/your-account/keys"
      ;;
    azure-official)
      info "Set AZURE_TRANSLATE_KEY in your .env file"
      ;;
  esac
  exit 1
fi

# ─── Resolve messages directory ──────────────────────────────────
FULL_MESSAGES_DIR="$WEB_DIR/$MESSAGES_DIR"
SOURCE_FILE="$FULL_MESSAGES_DIR/$SOURCE_LOCALE.json"

if [ ! -f "$SOURCE_FILE" ]; then
  error "Source file not found: $SOURCE_FILE"
  exit 1
fi

# ─── Translate ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Translating from ${SOURCE_LOCALE} to ${#TARGET_LOCALES[@]} locale(s)${RESET}"
echo -e "${BOLD}Provider: ${PROVIDER}${RESET}"
echo ""

FAILED=0

for locale in "${TARGET_LOCALES[@]}"; do
  locale=$(echo "$locale" | tr -d ' "')
  [ -z "$locale" ] && continue

  TARGET_FILE="$FULL_MESSAGES_DIR/$locale.json"

  if [ -f "$TARGET_FILE" ] && [ -z "$OVERRIDE" ]; then
    info "$locale: Updating (new keys only)..."
  else
    info "$locale: Translating all keys..."
  fi

  if npx i18n-auto-translation \
    --apiProvider "$PROVIDER" \
    --key "$API_KEY" \
    --filePath "$SOURCE_FILE" \
    --from "$SOURCE_LOCALE" \
    --to "$locale" \
    --maxLinesPerRequest "$MAX_LINES" \
    --saveTo "$TARGET_FILE" \
    $OVERRIDE \
    2>&1; then
    success "$locale: Done -> $TARGET_FILE"
  else
    error "$locale: Translation failed"
    FAILED=$((FAILED + 1))
  fi
  echo ""
done

# ─── Summary ─────────────────────────────────────────────────────
TOTAL=${#TARGET_LOCALES[@]}
SUCCEEDED=$((TOTAL - FAILED))

echo ""
if [ $FAILED -eq 0 ]; then
  success "All $TOTAL locale(s) translated successfully"
else
  warn "$SUCCEEDED/$TOTAL succeeded, $FAILED failed"
fi

echo ""
info "Next: update i18n/request.ts to support the new locales"
info "Available locales: $(ls "$FULL_MESSAGES_DIR"/*.json | xargs -I{} basename {} .json | tr '\n' ', ' | sed 's/,$//')"
