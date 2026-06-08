# Packages Workspace

Packages are for shared contracts and utilities used by more than one app or service. Root `CLAUDE.md`, `CLAUDE FILES/core.md`, and the relevant stack file always apply.

Do not move code here just to make a local file shorter. Shared code should exist because at least two concrete consumers need the same stable abstraction.

Keep package APIs small, typed, documented by tests, and independent of app runtime details. Shared packages should not read env, create provider clients, know route structure, or perform side effects at import time.

Breaking changes here can affect the whole monorepo. Update all consumers and run the narrow package checks plus any app checks that consume the changed contract.
