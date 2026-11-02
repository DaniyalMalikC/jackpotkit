# JackpotKit — agent guide

Open-source game mechanics and animated components for React and React Native. A pnpm + Turborepo
monorepo publishing five `@jackpotkit/*` packages to npm.

Current programme status, decisions, and blockers: `docs/maintainers/project-plan.md`. Read it
before starting work and update its status table when a phase lands.

## Layout

- `packages/core`: pure TypeScript engines for all seven games. Must not import React, React Native,
  Expo, Skia, Reanimated, Gesture Handler, or browser globals (`pnpm check:boundaries`).
- `packages/react`: web hooks and renderers (SVG, Canvas, Pointer Events). Must stay SSR-safe.
- `packages/react-native`: native hooks and renderers. Skia is loaded only from `/scratch-card`.
- `packages/theme`, `packages/testing`: theme contracts and presets; deterministic test helpers.
- `packages/shared-config`: private ESLint, Prettier, and tsconfig presets.
- `apps/docs`: documentation site rendering root `docs/` content.
- `apps/web-example` (Vite) and `apps/expo-example` (Expo Router): galleries and playgrounds.

Games: spin-wheel, scratch-card, slot-machine, bingo, dice, coin-flip, lucky-box. Each one has a core
engine, a React and a React Native renderer, an exact subpath export, docs, and example coverage.

## Toolchain

Node 24 (`.node-version`) and pnpm 11.21.0 (`packageManager`). In cloud sessions, run
`source /opt/nvm/nvm.sh && nvm use 24` first, then `corepack enable` if needed.

```bash
pnpm install --frozen-lockfile
pnpm validate        # full gate: format, lint, typecheck, test, build, expo-doctor, check:*
pnpm --filter @jackpotkit/react test
```

`expo-doctor` needs network access to `exp.host`. When it is unreachable, run the other gates
individually and report the doctor result as unverified, not passed.

## Non-negotiable rules

- Outcomes come from core engines, controlled results, or result providers, never from animation.
  Valuable rewards must be server-authoritative (`docs/server-authoritative-results.md`).
- No telemetry, payments, wallets, or wagering features (`pnpm check:privacy`).
- Any change to a publishable package needs a Changeset. Breaking changes need a migration section
  (`docs/versioning.md`).
- Do not add runtime dependencies to published packages without updating
  `docs/maintainers/dependency-review.md` and `scripts/check-package-dependencies.mjs`.
- Never document an API that does not exist. Generate reference material from exported types.
- Every bug fix includes a regression test where practical. Never weaken a test to get green.

## Git and review

- One concern per branch: `feat/`, `fix/`, `docs/`, `test/`, `refactor/`, `chore/`, `release/`.
  Use a separate worktree for parallel work.
- Conventional Commits (`feat(playground): ...`). Use the configured git identity. Do not add AI
  co-author trailers or session links.
- Agents may open issues and draft PRs. Merging, npm publishing, production deploys, and destructive
  operations require human approval.

## Agents

Role definitions live in `.claude/agents/`. The orchestrator plans and assigns work; specialists stay
within their scope and end with the report format below.

Report format: **Decisions made**, **Completed** (files and the checks run, with results),
**Remaining**, **Blockers**, **Next actions** (priority and owner agent).
