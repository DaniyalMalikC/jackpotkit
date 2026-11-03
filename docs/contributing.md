---
title: Contributing
description: Set up the monorepo, run the quality gates and end-to-end tests, and propose changes.
---

# Contributing

The repository's [CONTRIBUTING.md](https://github.com/DaniyalMalikC/jackpotkit/blob/main/CONTRIBUTING.md) covers pull request expectations, the
architectural constraints, and the release process. This page is the practical development guide.

## Toolchain

- Node.js 24 (`.node-version`; `engines` allows `>=24.3.0 <25`).
- pnpm 11.21.0, pinned in the root `packageManager` field. Enable it with Corepack.
- TypeScript 6.0.3, pinned. Do not adopt TypeScript 7 until `typescript-eslint` supports it.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build          # builds every package once; apps import the built packages
```

The workspace uses strict peer dependencies and does not auto-install peers. New dependencies must
satisfy the minimum release age that pnpm enforces; do not add exclusions to get a fresh version
in. Runtime dependencies of published packages need a review entry in
[Dependency review](./maintainers/dependency-review.md).

## Layout

| Path                        | Contents                                                             |
| --------------------------- | -------------------------------------------------------------------- |
| `packages/core`             | Pure TypeScript engines. No React, DOM, or native imports.           |
| `packages/react`            | React web hooks and renderers. Must stay SSR-safe.                   |
| `packages/react-native`     | React Native hooks and renderers. Skia only in `/scratch-card`.      |
| `packages/theme`, `testing` | Theme contracts and presets; deterministic test helpers.             |
| `apps/docs`                 | This site (Next.js and Fumadocs). Content lives in `docs/`.          |
| `apps/web-example`          | Vite gallery of the React web renderers.                             |
| `apps/expo-example`         | Expo Router gallery; its web export is the docs' native preview.     |
| `apps/e2e`                  | Playwright suites for the gallery, the docs, and the native preview. |

## Everyday commands

```bash
pnpm --filter @jackpotkit/react test          # one package's unit tests
pnpm --filter @jackpotkit/docs dev            # docs at http://localhost:3000
pnpm --filter @jackpotkit/web-example dev     # Vite gallery
pnpm --filter @jackpotkit/expo-example dev    # Expo gallery
pnpm format && pnpm lint && pnpm typecheck && pnpm test
pnpm validate                                 # the full CI gate (see below)
```

## Testing guidelines

- Engines: test rules in `packages/core` with injected `SequenceRandomSource` values or seeds. Assert
  exact outcomes, never statistics.
- Renderers: React web tests use Vitest and Testing Library, plus axe for WCAG checks. React Native
  tests use Jest with `@react-native/jest-preset` and `@testing-library/react-native`. Prefer
  controlled results and `reduceMotion`; do not assert animation frames.
- Every bug fix needs a regression test where practical. Never weaken an existing test to get green.
- Docs: `pnpm --filter @jackpotkit/docs test` runs the link checker, the playground schema and code
  generation tests, the generated API table checks, and a type-check of every code sample in
  `apps/docs/examples/`. New samples go in that directory and are embedded with `<include>`.

## End-to-end tests

`apps/e2e` runs three Playwright projects per browser: `gallery-*` (Vite gallery), `docs-*` (the docs
site, including axe scans of every page), and `native-*` (the Expo web export).

```bash
pnpm turbo run build --filter=@jackpotkit/web-example... --filter=@jackpotkit/docs...
pnpm turbo run build:web --filter=@jackpotkit/expo-example
pnpm --filter @jackpotkit/e2e exec playwright install chromium   # once
pnpm test:e2e
```

| Variable                                               | Default            | Purpose                                                                                                                                                    |
| ------------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GALLERY_PORT`, `DOCS_PORT`, `NATIVE_PORT`             | 4173, 3210, 4174   | Ports for the servers the suite starts.                                                                                                                    |
| `GALLERY_BASE_URL`, `DOCS_BASE_URL`, `NATIVE_BASE_URL` | unset              | Test an already running server instead.                                                                                                                    |
| `NEXT_PUBLIC_NATIVE_PREVIEW_URL`                       | production preview | Native preview origin baked into the docs build. Set it to the local native server (for example `http://127.0.0.1:4174`) before building the docs for E2E. |
| `E2E_BROWSERS`                                         | `chromium`         | Comma-separated `chromium`, `firefox`, `webkit`.                                                                                                           |
| `PW_CHROMIUM_PATH`                                     | unset              | Use a preinstalled Chromium instead of Playwright's download.                                                                                              |

If the default ports are busy, pick free ones and keep `NEXT_PUBLIC_NATIVE_PREVIEW_URL` pointing at
the native port, for example
`GALLERY_PORT=4691 DOCS_PORT=3691 NATIVE_PORT=4692 NEXT_PUBLIC_NATIVE_PREVIEW_URL=http://127.0.0.1:4692`.
Run one project with `pnpm --filter @jackpotkit/e2e exec playwright test --project=docs-chromium`.

## CI gates

Pull requests run `ci.yml` ([CI and agent automation](./maintainers/automation.md)):

- **validate**: `pnpm validate`, which runs Prettier, ESLint, type checks, unit tests, builds,
  `expo-doctor` (needs network access to `exp.host`), and the package gates: `check:boundaries`
  (core imports nothing platform-specific), `check:dependencies`, `check:privacy` (no telemetry),
  `check:exports`, `check:consumers` (packed packages install and server-render in a clean
  consumer), `check:packs`, and `check:api` (package types).
- **e2e**: builds the gallery, the docs, and the Expo web export, then runs the Playwright suite in
  Chromium.

## Changes and commits

- One concern per branch (`feat/`, `fix/`, `docs/`, `test/`, `refactor/`, `chore/`, `release/`) and
  Conventional Commits.
- Every change to a publishable package needs a Changeset (`pnpm changeset`). Breaking changes need a
  migration section ([Versioning](./versioning.md)).
- Do not add telemetry, payments, wagering features, or animation-derived outcomes.

New games follow the [game development template](./maintainers/game-development-template.md). See
[Releasing](./maintainers/releasing.md) for the version pull request and approved publication.
