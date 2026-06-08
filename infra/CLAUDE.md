# Infrastructure Workspace

Infrastructure changes affect availability, security, cost, and deployment. Read `CLAUDE FILES/core.md`, `CLAUDE FILES/typescript.md`, and `CLAUDE FILES/security.md` before changing CDK stacks or deployment wiring.

Infrastructure code should be deterministic and reviewable. Prefer explicit names, least-privilege IAM, encrypted storage, tagged resources, and observable defaults.

Do not hardcode account-specific secrets, access keys, domains, or one-off local paths. Use validated config and documented environment variables.

Every meaningful infrastructure change needs a synth or snapshot-style test update so reviewers can see the resource-level effect.
