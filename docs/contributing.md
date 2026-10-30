---
title: Contributing
sidebar_position: 16
---

# Contributing

Use Node 24 and the pnpm version pinned in the root `packageManager` field.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm validate
```

Changes to publishable packages require a Changeset. Pull requests must preserve the dependency boundary around `@jackpotkit/core` and must not introduce telemetry, payment behavior, or animation-derived outcomes.

See [Releasing](./maintainers/releasing.md) for the version pull request and approved publication process.

New games follow the [game development template](./maintainers/game-development-template.md). Each game requires pure engine types and validation, deterministic tests, platform renderers, accessibility, examples, documentation, exports, and a Changeset.
