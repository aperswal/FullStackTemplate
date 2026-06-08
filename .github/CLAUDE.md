# GitHub Automation

This folder owns CI, deployment workflows, Dependabot, and PR templates. Changes here affect every contributor and deployment path.

Keep workflows deterministic and least-privilege. Scope permissions per job, pin action versions to stable major versions or stronger where appropriate, and avoid exposing secrets to pull-request jobs from untrusted forks.

Use the same checks developers run locally: lint, typecheck, tests, coverage, build, service verifies, and CDK validation. Do not create a CI-only behavior path unless the difference is documented.

Prefer one reusable job pattern over duplicated shell across workflows. When a command changes in `package.json`, Makefiles, or scripts, update CI in the same change.
