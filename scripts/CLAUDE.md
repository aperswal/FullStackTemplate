# Scripts

Scripts automate setup, local services, coverage, translation, OAuth, Stripe, and environment writing. They are part of the product's operational surface, not throwaway glue.

Keep scripts idempotent, resumable when practical, and safe to re-run. A script should check prerequisites, explain missing tools, and fail with a useful message.

For shell scripts, use `set -euo pipefail`, quote variables, avoid parsing fragile human output, and keep shared helpers in `scripts/lib/`.

Never print secrets, write secrets to tracked files, or silently overwrite a user's local env without confirmation.

Prefer existing helper libraries over duplicating setup logic. If a script must call a provider CLI, isolate that behavior and make dry-run or validation paths clear.
