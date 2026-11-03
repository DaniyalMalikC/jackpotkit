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
| Editable sandbox | "Open in StackBlitz" via StackBlitz's POST API (B2); an embedded Sandpack iframe is deferred                              | Isolates user code from the docs origin with no in-page code execution and no new runtime dependency.                 |
| Native preview   | Deploy the `apps/expo-example` web export and embed it per game; add Expo Snack links once compatibility is verified      | Real `@jackpotkit/react-native` code via react-native-web. No EAS account is configured, so QR previews are deferred. |
| Companion repos  | Convert `jackpotkit-web` and `jackpotkit-app` into scheduled published-package smoke tests                                | Keeps an independent clean-consumer check after each release.                                                         |
| Agent automation | `.claude/agents/` definitions + GitHub Actions running Claude Code on a schedule, on `@claude` mentions, and on PR review | Agent files alone do not execute anything. Actions supply triggers, scoped permissions, logs, and cost limits.        |

## Phases

| Phase | Scope                                                                            | Owner agent                                | Status                                  |
| ----- | -------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------- |
| A     | `CLAUDE.md`, agent definitions, maintainer-doc separation, this record           | orchestrator                               | Done                                    |
| B1    | Fumadocs site, homepage, navigation, content migration                           | docs-engineer                              | Done                                    |
| B2    | Playground component, control schemas for all seven games, event log             | playground-engineer                        | Done                                    |
| B3    | Slot Machine font-scale fix with regression test; deeper React web tests         | library-developer, react-native-specialist | Done (real-device verification pending) |
| B4    | Playwright E2E, CI gates, Claude Code workflows                                  | qa-engineer, devops-engineer               | Done                                    |
| C     | Native preview deploy and embeds, Snack verification, companion repos at `1.1.0` | react-native-specialist                    | Done (Snack and device checks pending)  |
| D     | Vercel deployment, SEO metadata, verified public access                          | devops-engineer                            | Live; SEO done, OG image pending        |
| E     | Missing reference pages, theming, recipes, FAQ, migration guide, backlog issues  | docs-engineer, product-researcher          | Not started                             |

B1, B3, and B4 can run in parallel after A. B2 integrates into B1. C and E follow B1. D needs Vercel
access.

## Open blockers

- Vercel: project `jackpotkit` (root `apps/docs`, Node 24, Git-linked) serves
  <https://jackpotkit.vercel.app>. The first deployment, built from `claude/charming-ptolemy-f1ecnh`,
  was promoted to production automatically and verified publicly (all routes 200, playgrounds mount,
  no console errors). Later branch pushes build as previews, so production follows `main`.
- An `ANTHROPIC_API_KEY` repository secret and the Claude GitHub App before the Claude Code workflows
  can run (they skip cleanly until then; see [CI and agent automation](./automation.md)).
- No EAS project, so Expo QR previews are deferred.
- Native preview: project `jackpotkit-native` (root `apps/expo-example`, Node 24, Git-linked) serves
  <https://jackpotkit-native.vercel.app>. Its first deployment, from `feat/docs-native-preview`, was
  promoted to production automatically. All seven `/embed/<game>` routes load in a cross-origin
  iframe with no page errors or failed requests, the `frame-ancestors` policy is served, and
  `canvaskit.wasm` is served as `application/wasm`.
- `expo-doctor` passes on GitHub runners after the Expo SDK 57 patch bump; it stays unverifiable
  from the cloud sandbox.
- Screen readers (VoiceOver, TalkBack), physical-device gestures, and Expo Snack compatibility remain
  human-operated gates.

## Follow-ups from integrated phases

- B3: verify the fixed-cell font-scale cap on an iOS simulator and an Android device at the largest
  accessibility text size.
- Web game wrappers are `div` elements with `aria-label` and no role (axe "needs review"). Decide
  whether to add `role="group"` across all games in one changeset.
- B2: the docs site had WCAG AA contrast failures outside the playground (Shiki `github-light/dark`
  tokens on the tinted code-block background, and the active sidebar link). B2 switched to the
  high-contrast GitHub themes, darkened one comment colour, and darkened the light primary colour;
  the docs E2E axe scans now cover every game page in both site themes.
- B2: decide whether to add an embedded Sandpack editor beside the StackBlitz handoff.
- The `webpack` and `serialize-javascript` overrides in `pnpm-workspace.yaml` no longer match any
  dependency after the Docusaurus removal.

- C1: verify Expo Snack with Expo SDK 57, Reanimated 4, and react-native-worklets before adding any
  Snack links (snack.expo.dev was unreachable from the C1 environment). Then do C2 (companion repos
  at `1.1.0`).
- C1: the `@jackpotkit/react-native` axe defects seen through react-native-web (Scratch Card,
  Bingo, Lucky Box label-in-name; Dice role-less face label) are fixed on `fix/rn-accessible-names`
  and their E2E `test.fail()` markers removed. VoiceOver and TalkBack checks of the new names, the
  Scratch Card value, and the hidden-until-revealed prize are still pending.
- C1: the Expo gallery's Spin Wheel no longer overrides `accessibilityLabels.spin` with the long
  "Spin the example wheel", which was also the hub's visible text and truncated to "Spin th…"; it
  uses the default `Spin` / `Spinning`. The library default `Spinning` may still be tight in the
  76 pt hub on web, where react-native-web cannot shrink text to fit.
- C1: narrow the preview's `frame-ancestors https://*.vercel.app` once the docs have a custom
  domain.

- Playground: segment colour swatches show a placeholder when a segment inherits its theme colour;
  show the resolved theme colour instead. Open the StackBlitz handoff in a real browser once deployed.

## Human approval gates

Agents may open issues, branches, reports, and draft pull requests. A maintainer must approve merges,
npm publication (the protected `npm` environment), production deployment configuration changes,
destructive operations, and breaking changes.
