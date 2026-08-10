---
title: Contributing
sidebar_position: 6
---

# Contributing

Use Node 24 and the pnpm version pinned in the root `packageManager` field.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm validate
```

Changes to publishable packages require a Changeset once the repository begins releasing packages. Pull requests must preserve the dependency boundary around `@jackpotkit/core` and must not introduce telemetry, payment behavior, or animation-derived outcomes.

The complete new-game contribution contract is added before the first stable release. At minimum, each game will require pure engine types and validation, deterministic tests, platform renderers, accessibility, examples, documentation, exports, and a Changeset.
