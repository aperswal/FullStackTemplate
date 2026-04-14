#!/usr/bin/env bash
# Fails if any tracked source file contains non-ASCII characters.
# Rationale: non-ASCII glyphs (em-dashes, box-drawing, arrows, checkmarks,
# smart quotes) are invisible failure modes. They break grep, diff
# alignment, terminal rendering, and copy-paste across tools. Pin the
# codebase to pure ASCII so every byte is predictable.
#
# Usage:
#   scripts/check-ascii.sh                 # scan all tracked files
#   scripts/check-ascii.sh path/to/file... # scan only the given paths

set -euo pipefail

# File extensions in scope. Add new source types here rather than relaxing
# the check for a single file.
IN_SCOPE_REGEX='\.(ts|tsx|js|jsx|mjs|cjs|md|mdx|json|ya?ml|py|sh|go|rs|sql|toml|html|css|scss)$|(^|/)Dockerfile(\..+)?$|(^|/)Makefile$'

# Paths to skip even if they match the extension filter. Lockfiles
# intentionally contain non-ASCII (hashes, author names).
EXCLUDE_REGEX='(^|/)(node_modules|\.next|dist|build|coverage|\.git|\.venv|venv|__pycache__|\.turbo|playwright-report|test-results)(/|$)|(^|/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|uv\.lock|Cargo\.lock|go\.sum)$'

collect_files() {
  if [[ $# -gt 0 ]]; then
    printf '%s\n' "$@"
  else
    if git rev-parse --git-dir >/dev/null 2>&1; then
      git ls-files
    else
      find . -type f ! -path '*/node_modules/*' ! -path '*/.git/*'
    fi
  fi
}

filter_in_scope() {
  grep -E "$IN_SCOPE_REGEX" | grep -Ev "$EXCLUDE_REGEX" || true
}

violations=0
first_violation_printed=0

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  [[ ! -f "$file" ]] && continue

  # Perl is portable (pre-installed on macOS and every major Linux distro)
  # and its regex engine reliably matches raw byte ranges.
  if matches=$(perl -ne 'print "$.: $_" if /[^\x00-\x7F]/' "$file") && [[ -n "$matches" ]]; then
    if [[ $first_violation_printed -eq 0 ]]; then
      echo "Non-ASCII characters found. Replace with ASCII equivalents:"
      echo "  em-dash -> -     box-drawing -> - | +"
      echo "  arrow -> -> <-   checkmark -> [OK] / [FAIL]"
      echo "  smart quote -> ' or \"   ellipsis -> ..."
      echo
      first_violation_printed=1
    fi
    echo "$file:"
    echo "$matches" | sed 's/^/  /'
    echo
    violations=$((violations + 1))
  fi
done < <(collect_files "$@" | filter_in_scope)

if [[ $violations -gt 0 ]]; then
  echo "check-ascii: $violations file(s) contain non-ASCII characters" >&2
  exit 1
fi

echo "check-ascii: all files are pure ASCII"
