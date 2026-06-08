# CDK App

This package owns AWS CDK infrastructure. Read the infra workspace guidance plus `CLAUDE FILES/typescript.md` and `CLAUDE FILES/security.md`.

Keep stacks focused by ownership: networking, storage, database, compute, IAM, monitoring, and deployment composition. Cross-stack references should be intentional and visible through typed construct props.

IAM must be least-privilege. Avoid wildcard actions and resources unless there is a documented AWS limitation and a narrowed condition.

Use `config.ts` for deployment configuration; do not read process env throughout stack files.

Run `pnpm --filter @template/cdk typecheck`, `pnpm --filter @template/cdk test`, and `pnpm --filter @template/cdk synth` when changing infrastructure behavior.
