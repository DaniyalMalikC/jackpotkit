# Contributing to JackpotKit

Thank you for helping build JackpotKit as a dependable open-source library rather than a showcase-only application.

## Development setup

Requirements:

- Node.js 24
- Corepack
- pnpm 11.21.0

```bash
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm install --frozen-lockfile
pnpm validate
```

Do not use another package manager or commit npm/yarn lockfiles.

TypeScript is intentionally pinned to 6.0.3. Do not adopt TypeScript 7 until the active
`typescript-eslint` release supports that compiler range.

## Pull requests

- Keep changes focused and preserve existing behavior.
- Add tests and documentation for public behavior.
- Run `pnpm validate` before requesting review.
- Add a Changeset for every change to a publishable package.
- Do not include credentials, generated archives, build outputs, or mandatory large assets.
- Do not introduce telemetry or a JackpotKit-controlled backend.

## Architectural constraints

`@jackpotkit/core` is pure TypeScript and cannot import React, React Native, Expo, Skia, Reanimated, Gesture Handler, or DOM APIs. Results, engine logic, platform state, rendering, and animation remain separate concerns.

Client randomness must not be described as cryptographically secure or sufficient for valuable rewards. Server-authoritative workflows belong in consumer applications; networking does not belong inside JackpotKit.

## Adding a game

A game contribution must ultimately include:

1. Core types and a pure engine.
2. Validation and typed errors.
3. Deterministic unit tests.
4. A React Native hook and renderer.
5. Controlled and server-authoritative result support where applicable.
6. Reset, disabled, accessibility, and reduced-motion behavior.
7. An Expo example and documentation.
8. Deliberate public exports and a Changeset.

See [the game development template](./docs/game-development-template.md) for expected organization.

## Releases

Changesets maintains a draft version pull request on `main`. npm publication runs separately through the manually approved `Publish` workflow and npm Trusted Publishing; contributors must never add an npm write token to the repository.

See [the release guide](./docs/releasing.md) for the complete sequence.

## Conduct and security

Participation is governed by [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Security reports must follow [SECURITY.md](./SECURITY.md).
