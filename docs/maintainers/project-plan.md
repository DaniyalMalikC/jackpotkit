---
title: Project plan and status
description: Programme status, architecture decisions, phases, and blockers.
---

# Project plan and status

This page is the durable record of the documentation-platform and maintenance programme. Agents and
maintainers update the status table when a phase lands, so work can resume without conversation
history. It is not a feature roadmap; see [Roadmap](../roadmap.md) for committed product work.

## Baseline audit (2026-10-30)

Verified on Node 24.22.2 and pnpm 11.21.0 against `main` at `543b599`.

- `pnpm validate` passes format, lint, typecheck, tests, and build. Only `expo-doctor` failed, because
  the audit sandbox could not reach `exp.host`; it is not a confirmed project defect.
- All seven `check:*` package gates pass.
- npm: `@jackpotkit/react` and `@jackpotkit/react-native` are at `1.1.0`; `core`, `theme`, and
  `testing` are at `1.0.0`.
- No public documentation site existed. The Docusaurus app targets GitHub Pages, but no workflow
  deploys it.
- Game pages had no live demos. Dice, Coin Flip, and Lucky Box had no props reference.
- `jackpotkit-web` and `jackpotkit-app` are published-package consumer verification harnesses pinned to
  `1.0.0`, not demos.
- Probable defect: React Native Slot Machine symbols use a fixed `fontSize` without a font-scale cap
  (`packages/react-native/src/slot-machine/slot-reel.tsx`), which clipped at the largest iOS text size in
  the 1.0.0 verification. Needs device confirmation.
- React web has 4 test files covering 7 renderers. The monorepo has no browser E2E suite.
- Packages are ESM-only. This is intentional and should be documented for CommonJS Jest consumers.

## Architecture decisions

| Decision         | Choice                                                                                                                    | Reason                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Docs framework   | Next.js App Router + Fumadocs + Tailwind + shadcn/ui in `apps/docs`, replacing Docusaurus                                 | Type-generated props tables, playground UI, native Vercel previews. No public URLs existed, so nothing breaks.        |
| Docs content     | MDX stays in the root `docs/` directory                                                                                   | Keeps content reviewable beside code and reusable by any renderer.                                                    |
| Web playground   | Real `@jackpotkit/react` components with typed per-game control schemas, event log, and generated code                    | Visitors use the shipped package, not a mock-up.                                                                      |
| Editable sandbox | Sandpack in an isolated iframe, plus "open in StackBlitz"                                                                 | Isolates user code from the docs origin.                                                                              |
| Native preview   | Deploy the `apps/expo-example` web export and embed it per game; add Expo Snack links once compatibility is verified      | Real `@jackpotkit/react-native` code via react-native-web. No EAS account is configured, so QR previews are deferred. |
| Companion repos  | Convert `jackpotkit-web` and `jackpotkit-app` into scheduled published-package smoke tests                                | Keeps an independent clean-consumer check after each release.                                                         |
| Agent automation | `.claude/agents/` definitions + GitHub Actions running Claude Code on a schedule, on `@claude` mentions, and on PR review | Agent files alone do not execute anything. Actions supply triggers, scoped permissions, logs, and cost limits.        |

## Phases

| Phase | Scope                                                                            | Owner agent                                | Status      |
| ----- | -------------------------------------------------------------------------------- | ------------------------------------------ | ----------- |
| A     | `CLAUDE.md`, agent definitions, maintainer-doc separation, this record           | orchestrator                               | Done        |
| B1    | Fumadocs site, homepage, navigation, content migration                           | docs-engineer                              | Done        |
| B2    | Playground component, control schemas for all seven games, event log             | playground-engineer                        | Not started |
| B3    | Slot Machine font-scale fix with regression test; deeper React web tests         | library-developer, react-native-specialist | Not started |
| B4    | Playwright E2E, CI gates, Claude Code workflows                                  | qa-engineer, devops-engineer               | Done        |
| C     | Native preview deploy and embeds, Snack verification, companion repos at `1.1.0` | react-native-specialist                    | Not started |
| D     | Vercel deployment, SEO metadata, verified public access                          | devops-engineer                            | Not started |
| E     | Missing reference pages, theming, recipes, FAQ, migration guide, backlog issues  | docs-engineer, product-researcher          | Not started |

B1, B3, and B4 can run in parallel after A. B2 integrates into B1. C and E follow B1. D needs Vercel
access.

## Open blockers

- Vercel project access for production and preview deployments.
- An `ANTHROPIC_API_KEY` repository secret and the Claude GitHub App before the Claude Code workflows
  can run (they skip cleanly until then; see [CI and agent automation](./automation.md)).
- E2E found two `@jackpotkit/react` accessibility defects, tracked as `test.fail()` checks in
  `apps/e2e/tests/gallery/accessibility.spec.ts`: Dice die faces use `aria-label` on a role-less
  `div` (axe `aria-prohibited-attr`), and the Slot Machine button's `aria-label="Spin reels"` omits
  its visible text "PULL TO SPIN" (axe `label-content-name-mismatch`).
- No EAS project, so Expo QR previews are deferred.
- Screen readers (VoiceOver, TalkBack), physical-device gestures, and `expo-doctor` network checks
  remain human-operated or network-dependent gates.

## Human approval gates

Agents may open issues, branches, reports, and draft pull requests. A maintainer must approve merges,
npm publication (the protected `npm` environment), production deployment configuration changes,
destructive operations, and breaking changes.
