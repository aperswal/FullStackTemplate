#!/usr/bin/env bash
# Assemble and write the .env file using .env.example as a structural template.

run_write_env() {
  step "Writing .env file"

  local env_file="$PROJECT_ROOT/.env"
  local example_file="$PROJECT_ROOT/.env.example"

  if [ ! -f "$example_file" ]; then
    error ".env.example not found at $example_file"
    return 1
  fi

  # --- Handle existing .env -----------------------------------
  if [ -f "$env_file" ]; then
    echo ""
    info "Existing .env file found."
    echo "  1) Merge (keep existing values, fill in missing keys)"
    echo "  2) Overwrite (replace entirely with new values)"
    echo "  3) Skip (don't touch .env)"
    echo -en "${BOLD}Choose [1/2/3]:${RESET} "
    read -r choice

    case "$choice" in
      1)
        info "Merging: existing values will be preserved."
        # Load existing values into accumulator (they won't overwrite what's already set
        # because env_set replaces, so we need to load existing FIRST, then overlay)
        local existing_vars="$PROJECT_ROOT/.setup-env-existing"
        cp "$ENV_ACCUMULATOR" "$existing_vars"

        # Read existing .env values
        while IFS= read -r line; do
          if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
            local key="${line%%=*}"
            local value="${line#*=}"
            env_set "$key" "$value"
          fi
        done < "$env_file"

        # Now overlay the new values (from setup) on top
        while IFS= read -r line; do
          if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
            local key="${line%%=*}"
            local value="${line#*=}"
            # Only set if the value is non-empty and non-placeholder
            if [ -n "$value" ] && [[ "$value" != *"placeholder"* ]]; then
              env_set "$key" "$value"
            fi
          fi
        done < "$existing_vars"

        rm -f "$existing_vars"
        ;;
      2)
        info "Overwriting .env"
        ;;
      3)
        info "Skipping .env write"
        return 0
        ;;
      *)
        info "Defaulting to merge"
        ;;
    esac
  fi

  # --- Write .env using .env.example as template --------------
  local output=""

  while IFS= read -r line; do
    # Comment or blank line - pass through as-is
    if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then
      output+="$line"$'\n'
      continue
    fi

    # KEY=value line
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      local key="${line%%=*}"
      local accumulated_value
      accumulated_value=$(env_get "$key")

      if [ -n "$accumulated_value" ]; then
        output+="${key}=${accumulated_value}"$'\n'
      else
        # Keep the default from .env.example
        output+="$line"$'\n'
      fi
      continue
    fi

    # Anything else - pass through
    output+="$line"$'\n'
  done < "$example_file"

  echo -n "$output" > "$env_file"
  chmod 600 "$env_file"

  mark_step_done "env"
  success "Wrote .env file"

  # Show a summary of what was set vs left empty
  echo ""
  info "Environment summary:"
  local set_count=0
  local empty_count=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      local key="${line%%=*}"
      local value="${line#*=}"
      if [ -n "$value" ] && [[ "$value" != *"placeholder"* ]]; then
        set_count=$((set_count + 1))
      else
        empty_count=$((empty_count + 1))
        echo -e "  ${DIM}(empty) $key${RESET}"
      fi
    fi
  done < "$env_file"
  echo -e "  ${GREEN}$set_count vars set${RESET}, ${YELLOW}$empty_count empty${RESET} (optional)"
}
