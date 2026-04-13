#!/usr/bin/env bash
# Coverage ratchet — prevents coverage from decreasing between PRs.
# Mirrors scripts/coverage-ratchet.ts for the Go worker service.
#
# Usage:
#   ./scripts/coverage-ratchet.sh          # Check against baseline
#   ./scripts/coverage-ratchet.sh --update # Update baseline to current
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COVERAGE_FILE="$SERVICE_DIR/coverage.out"
BASELINE_FILE="$SERVICE_DIR/.coverage-baseline.json"
TOLERANCE="0.5"

get_coverage() {
    go tool cover -func="$COVERAGE_FILE" | awk '/^total:/ { gsub(/%/, "", $3); print $3 }'
}

if [ ! -f "$COVERAGE_FILE" ]; then
    echo "Coverage file not found at $COVERAGE_FILE"
    echo 'Run "make test" first to generate coverage data.'
    exit 1
fi

CURRENT=$(get_coverage)

if [ "${1:-}" = "--update" ]; then
    printf '{"statements": %s}\n' "$CURRENT" > "$BASELINE_FILE"
    echo "Coverage baseline updated: statements=${CURRENT}%"
    exit 0
fi

if [ ! -f "$BASELINE_FILE" ]; then
    echo "No baseline found — creating initial baseline from current coverage."
    printf '{"statements": %s}\n' "$CURRENT" > "$BASELINE_FILE"
    echo "Baseline created at ${CURRENT}%. Future PRs will be compared against this."
    exit 0
fi

BASELINE=$(python3 -c "import json; print(json.load(open('$BASELINE_FILE'))['statements'])")

echo "Coverage Ratchet Check (Go)"
echo "=================================================="
printf "%-15s %-12s %-12s %s\n" "Metric" "Baseline" "Current" "Result"
echo "--------------------------------------------------"

DIFF=$(python3 -c "d=$CURRENT-$BASELINE; print(f'{d:+.1f}%')")
PASSED=$(python3 -c "print('PASS' if $CURRENT - $BASELINE >= -$TOLERANCE else 'FAIL')")

printf "%-15s %-12s %-12s %s (%s)\n" "statements" "${BASELINE}%" "${CURRENT}%" "$PASSED" "$DIFF"
echo "=================================================="

if [ "$PASSED" = "FAIL" ]; then
    echo ""
    echo "Coverage regression detected. Add tests to bring coverage back up before merging."
    exit 1
fi

echo ""
echo "All coverage metrics maintained or improved."
