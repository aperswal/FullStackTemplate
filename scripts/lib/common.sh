#!/usr/bin/env bash
# Shared utilities for the setup script: colors, prompts, env var accumulator, state tracking.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_FILE="$PROJECT_ROOT/.setup-state"
ENV_ACCUMULATOR="$PROJECT_ROOT/.setup-env-vars"

# --- Colors ----------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

info()    { echo -e "${BLUE}[info]${RESET} $*"; }
success() { echo -e "${GREEN}[done]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET} $*"; }
error()   { echo -e "${RED}[error]${RESET} $*" >&2; }

step() {
  echo ""
  echo -e "${BOLD}--- $* ---${RESET}"
}

banner() {
  echo ""
  echo -e "${BOLD}${GREEN}"
  echo "  +-----------------------------------------+"
  echo "  |        Full-Stack Template Setup         |"
  echo "  +-----------------------------------------+"
  echo -e "${RESET}"
}

# --- Prompts ---------------------------------------------------

# Ask a yes/no question. Returns 0 for yes, 1 for no.
# Usage: confirm "Set up Stripe?" "Y"   (default yes)
#        confirm "Overwrite .env?" "n"   (default no)
confirm() {
  local message="$1"
  local default="${2:-Y}"
  local prompt

  if [[ "$default" =~ ^[Yy] ]]; then
    prompt="[Y/n]"
  else
    prompt="[y/N]"
  fi

  echo -en "${BOLD}$message${RESET} $prompt "
  read -r answer
  answer="${answer:-$default}"

  [[ "$answer" =~ ^[Yy] ]]
}

# Prompt for a value with a default.
# Usage: result=$(prompt_value "App URL" "http://localhost:3000")
prompt_value() {
  local message="$1"
  local default="$2"
  local answer

  echo -en "${BOLD}$message${RESET} ${DIM}[$default]${RESET}: "
  read -r answer
  echo "${answer:-$default}"
}

# Prompt for a secret (no echo).
# Usage: secret=$(prompt_secret "Paste your API key")
prompt_secret() {
  local message="$1"
  local answer

  echo -en "${BOLD}$message${RESET}: "
  read -rs answer
  echo "" >&2
  echo "$answer"
}

# --- Env Var Accumulator --------------------------------------
# Uses a flat key=value file to avoid bash 3.2 associative array limitation on macOS.

env_init() {
  : > "$ENV_ACCUMULATOR"
}

env_set() {
  local key="$1"
  local value="$2"

  # Remove existing entry if present, then append
  if [ -f "$ENV_ACCUMULATOR" ]; then
    grep -v "^${key}=" "$ENV_ACCUMULATOR" > "${ENV_ACCUMULATOR}.tmp" 2>/dev/null || true
    mv "${ENV_ACCUMULATOR}.tmp" "$ENV_ACCUMULATOR"
  fi
  echo "${key}=${value}" >> "$ENV_ACCUMULATOR"
}

env_get() {
  local key="$1"
  if [ -f "$ENV_ACCUMULATOR" ]; then
    grep "^${key}=" "$ENV_ACCUMULATOR" 2>/dev/null | head -1 | cut -d'=' -f2-
  fi
}

# --- State Management (Idempotency) --------------------------

state_init() {
  if [ ! -f "$STATE_FILE" ]; then
    echo "# Setup state - tracks provisioned resources for idempotent re-runs" > "$STATE_FILE"
    chmod 600 "$STATE_FILE"
  fi
}

state_set() {
  local key="$1"
  local value="$2"

  if [ -f "$STATE_FILE" ]; then
    grep -v "^${key}=" "$STATE_FILE" > "${STATE_FILE}.tmp" 2>/dev/null || true
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
  fi
  echo "${key}=${value}" >> "$STATE_FILE"
  chmod 600 "$STATE_FILE"
}

state_get() {
  local key="$1"
  if [ -f "$STATE_FILE" ]; then
    grep "^${key}=" "$STATE_FILE" 2>/dev/null | head -1 | cut -d'=' -f2-
  fi
}

is_step_done() {
  local step="$1"
  [ "$(state_get "step_${step}")" = "done" ]
}

mark_step_done() {
  local step="$1"
  state_set "step_${step}" "done"
}

# --- Helpers --------------------------------------------------

require_cmd() {
  if ! command -v "$1" &>/dev/null; then
    error "$1 is required but not installed."
    return 1
  fi
}

open_url() {
  local url="$1"
  if command -v open &>/dev/null; then
    open "$url"
  elif command -v xdg-open &>/dev/null; then
    xdg-open "$url"
  else
    info "Open this URL in your browser: $url"
  fi
}

is_port_in_use() {
  lsof -i ":$1" &>/dev/null
}
