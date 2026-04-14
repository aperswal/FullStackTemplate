"""Coverage ratchet - prevents coverage from decreasing between PRs.

Mirrors scripts/coverage-ratchet.ts for the Python service.

Usage:
    python scripts/coverage_ratchet.py          # Check against baseline
    python scripts/coverage_ratchet.py --update # Update baseline to current
"""

import json
import os
import subprocess
import sys
from pathlib import Path

SERVICE_DIR = Path(__file__).resolve().parent.parent
BASELINE_FILE = SERVICE_DIR / ".coverage-baseline.json"
COVERAGE_JSON = SERVICE_DIR / "coverage.json"
TOLERANCE = 0.5


def run_tests_with_coverage() -> dict[str, float]:
    """Run pytest and return statement + branch coverage percentages."""
    env = {**os.environ, "_TESTING": "1"}
    subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "--cov=scripts",
            "--cov-report=json:" + str(COVERAGE_JSON),
            "--cov-branch",
            "-q",
            "--no-header",
            "--override-ini=addopts=",
        ],
        cwd=str(SERVICE_DIR),
        env=env,
        check=False,
    )

    if not COVERAGE_JSON.exists():
        print("Coverage JSON not found. Tests may have failed.")
        sys.exit(1)

    data = json.loads(COVERAGE_JSON.read_text())
    totals = data["totals"]

    return {
        "statements": totals["percent_covered"],
        "branches": totals.get("percent_covered_branches", totals["percent_covered"]),
    }


def main() -> None:
    """Run coverage ratchet check or update baseline."""
    is_update = "--update" in sys.argv

    current = run_tests_with_coverage()

    if is_update:
        BASELINE_FILE.write_text(json.dumps(current, indent=2) + "\n")
        print("Coverage baseline updated:")
        for metric, value in current.items():
            print(f"  {metric}: {value:.1f}%")
        return

    if not BASELINE_FILE.exists():
        print("No baseline found - creating initial baseline from current coverage.")
        BASELINE_FILE.write_text(json.dumps(current, indent=2) + "\n")
        print("Baseline created. Future PRs will be compared against this.")
        return

    baseline = json.loads(BASELINE_FILE.read_text())
    failed = False

    print("Coverage Ratchet Check (Python)")
    print("=" * 50)
    print(f"{'Metric':<15} {'Baseline':<12} {'Current':<12} Result")
    print("-" * 50)

    for metric in ["statements", "branches"]:
        base = baseline.get(metric, 0)
        curr = current.get(metric, 0)
        diff = curr - base
        passed = diff >= -TOLERANCE
        status = "PASS" if passed else "FAIL"

        if not passed:
            failed = True

        diff_str = f"{diff:+.1f}%"
        base_str = f"{base:.1f}%"
        curr_str = f"{curr:.1f}%"
        print(f"{metric:<15} {base_str:<12} {curr_str:<12} {status} ({diff_str})")

    print("=" * 50)

    if failed:
        print("\nCoverage regression detected. Add tests to bring coverage back up before merging.")
        sys.exit(1)

    print("\nAll coverage metrics maintained or improved.")


if __name__ == "__main__":
    main()
