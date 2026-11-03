---
title: Backlog
description: Prioritized follow-ups collected from the programme phases, each ready to become a GitHub issue.
---

# Backlog

Prioritized follow-ups from the [project plan](./project-plan.md) and the Phase E documentation
audit. Each item is written so it can be copied into a GitHub issue: the heading is the title, and
the fields map to labels, assignee role, and the issue body. No issues have been created from this
list yet; a maintainer decides when to file them.

- **P1**: user-facing defects, accessibility failures, or gaps that block a common use case.
- **P2**: consistency, maintainability, and verification work that should land in the next minor.
- **P3**: improvements and decisions without a deadline.

Owner agents are defined in `.claude/agents/`. Items marked _human gate_ need a maintainer or a
physical device and cannot be closed by an agent alone.

## P1

### Translatable built-in text in the React web renderers

- **Labels**: `enhancement`, `a11y`, `i18n`, `package:react`
- **Owner**: library-developer
- **Context**: React web components accept only `accessibilityLabel`. Built-in control and result
  text is English only, for example Spin Wheel `Spin` / `Spinning…` / `Selected: …` and Bingo
  `Call next number`. React Native has `accessibilityLabels` on Spin Wheel, Scratch Card, Slot
  Machine, and Bingo, but not on Dice, Coin Flip, or Lucky Box on either platform. Documented in
  [Translating labels](../recipes/translating-labels.mdx).
- **Acceptance criteria**:
  - Every game on both platforms accepts the same label override keys for its controls, busy state,
    and result announcement (additive, minor release).
  - Visible built-in text that is part of an accessible name is overridable together with it, so
    label-in-name (WCAG 2.5.3) still holds.
  - Unit tests per game; a Changeset; the translating-labels recipe and the generated API tables
    show the new props; the descriptions in `apps/docs/lib/api-reference/descriptions.ts` cover them.

### React Native accessible-name defects found through react-native-web

- **Labels**: `bug`, `a11y`, `package:react-native`
- **Owner**: react-native-specialist (_human gate_ for screen-reader checks)
- **Context**: E2E `test.fail()` cases in `apps/e2e/tests/native/games.ts`: Scratch Card surface
  label omits its visible prize text; Bingo "Call next Bingo number" vs "Call next number"; Lucky
  Box "Reveal Lucky Box" vs "Reveal selection" and "Locked gift" vs "Locked gift · unavailable";
  default Dice faces put `accessibilityLabel` on a role-less view.
- **Status**: code fix, Changeset (`rn-accessible-names`), and marker removal landed on
  `feat/docs-reference-and-brand`; only the device check remains.
- **Acceptance criteria**:
  - One Changeset fixes all listed cases; the matching `test.fail()` markers are removed and pass.
  - VoiceOver and TalkBack confirm the announced names on a device.

### Decide `reduceMotion={false}` parity

- **Labels**: `a11y`, `api`, `package:react`, `package:react-native`
- **Owner**: library-developer, with docs-engineer
- **Context**: On the web, `reduceMotion={false}` forces full motion even when the OS requests
  reduced motion. On React Native, `false` behaves like omitting the prop, so the system setting
  always wins. [Accessibility review](../accessibility.md) says components "support an explicit
  override", which is true only on the web. Documented as a platform difference in
  [Reduced motion](../recipes/reduced-motion.mdx).
- **Acceptance criteria**:
  - A recorded decision (keep the difference, or align the platforms in a major or opt-in minor).
  - The accessibility review page and the generated `reduceMotion` description match the decision.
  - If behaviour changes: tests on both platforms and a Changeset with migration notes.

### Verify the fixed-cell font-scale cap on devices

- **Labels**: `a11y`, `verification`, `package:react-native`
- **Owner**: react-native-specialist (_human gate_)
- **Context**: B3 follow-up. The cap is covered by unit tests but not seen on hardware.
- **Acceptance criteria**: Screenshots at the largest accessibility text size on an iOS simulator
  and an Android device for Slot Machine, Bingo, Dice, Coin Flip, and Spin Wheel, with no clipping;
  the result recorded in the project plan.

## P2

### Verify Expo Snack and add Snack links

- **Labels**: `docs`, `verification`, `package:react-native`
- **Owner**: react-native-specialist (_human gate_)
- **Context**: C1 follow-up. Snack support for Expo SDK 57, Reanimated 4, and worklets is
  unverified, so game pages have no Snack links.
- **Acceptance criteria**: A Snack runs at least Spin Wheel and Dice; if it works, each game page
  links a Snack; if not, the incompatibility is recorded in the project plan.

### Coin Flip back face: choose a readable text color

- **Labels**: `bug`, `a11y`, `package:react`, `package:react-native`
- **Owner**: library-developer
- **Context**: the web coin's back face always draws text in `theme.colors.onPrimary`
  (`packages/react/src/coin-flip/coin-flip.tsx`), while the front face uses
  `selectReadableColor`. A custom theme with a mid-tone `coinBack` fails WCAG contrast; the docs
  dark brand theme hit 2.9:1 until its `coinBack` was lightened. The docs axe test only caught it
  when the random result was Tails.
- **Acceptance criteria**:
  - Both faces choose a readable text color on both platforms, with a regression test using a
    mid-tone `coinBack`; a patch Changeset.
  - The docs axe test checks both faces deterministically (controlled `faceId`), not one random
    outcome.

### Move prop descriptions into TSDoc on the exported types

- **Labels**: `docs`, `dx`, `package:react`, `package:react-native`, `package:core`
- **Owner**: library-developer, with docs-engineer
- **Context**: Exported prop types carry almost no TSDoc, so the generated API tables take their
  descriptions from `apps/docs/lib/api-reference/descriptions.ts`. Editors show no hover help.
- **Acceptance criteria**:
  - Every public prop, ref method, and result field has a one-sentence TSDoc comment, with
    `@defaultValue` where a default is not read from destructuring.
  - Entries in `descriptions.ts` that the TSDoc now covers are deleted; `test/api-reference.test.ts`
    still passes (it requires a description for every member).
  - Changesets (patch, documentation only).

### Web game wrappers: add a role

- **Labels**: `a11y`, `package:react`
- **Owner**: library-developer
- **Context**: Web game wrappers are `div` elements with `aria-label` and no role (axe "needs
  review").
- **Acceptance criteria**: All seven wrappers get `role="group"` (or a documented alternative) in
  one Changeset; axe reports no incomplete results for them; tests updated.

### Spin Wheel hub: visible text separate from the accessible name

- **Labels**: `a11y`, `api`, `package:react-native`
- **Owner**: react-native-specialist
- **Context**: C1 follow-up. On React Native, `accessibilityLabels.spin` is also the hub's visible
  text, so a long accessible label truncates ("Spin th…").
- **Acceptance criteria**: A decision and, if adopted, an additive label key for visible hub text
  that keeps label-in-name; gallery updated to a short visible label.

### `status` prop parity on the web

- **Labels**: `api`, `package:react`
- **Owner**: library-developer
- **Context**: React Native Spin Wheel, Scratch Card, and Slot Machine accept a controlled `status`;
  the web components do not (shown by the generated platform differences on each game page).
- **Acceptance criteria**: A decision recorded in the API review; if added, tests and a Changeset.

### Track `fumadocs-typescript` and its TypeScript 7 prerelease

- **Labels**: `dependencies`, `docs`
- **Owner**: devops-engineer
- **Context**: `fumadocs-typescript@5.6.0` (docs-only dependency, used at build time for API tables)
  depends on `typescript@7.1.0-beta`, a native TypeScript build that runs in its own process. The
  rest of the repository stays on TypeScript 6.0.3.
- **Acceptance criteria**: When a stable TypeScript 7 release or a newer fumadocs-typescript is
  available past the minimum release age, upgrade it, run the docs build and
  `test/api-reference.test.ts`, and record the version in the project plan.

### Remove stale package overrides

- **Labels**: `chore`, `dependencies`
- **Owner**: devops-engineer
- **Context**: The `webpack` and `serialize-javascript` overrides in `pnpm-workspace.yaml` match no
  dependency since the Docusaurus removal.
- **Acceptance criteria**: Overrides removed; `pnpm install --frozen-lockfile` and `pnpm validate`
  pass; the lockfile diff only drops the overrides.

### Confirm the production domain

- **Labels**: `infra`, `seo`
- **Owner**: devops-engineer (_human gate_)
- **Context**: `SITE_URL` defaults to `https://jackpotkit.vercel.app`, and the native preview's
  `frame-ancestors` allows `https://*.vercel.app`.
- **Acceptance criteria**: `SITE_URL` set in Vercel; canonical, sitemap, and Open Graph URLs use the
  final domain; `frame-ancestors` narrowed to it and the Vercel preview pattern actually in use.

## P3

### Generated hook API tables

- **Labels**: `docs`
- **Owner**: docs-engineer
- **Context**: Game pages generate props, ref, and core type tables. `Use<Game>Options` and
  `Use<Game>Return` are described in prose only.
- **Acceptance criteria**: Each game page has generated hook tables for both platforms, covered by
  `test/api-reference.test.ts`.

### Per-page Open Graph images

- **Labels**: `docs`, `seo`
- **Owner**: docs-engineer
- **Context**: Every page shares the static site image `/og.png`.
- **Acceptance criteria**: Docs pages get a generated image with the page title, built statically
  with system or bundled fonts and no network access at build time.

### Playground: show resolved theme colors in segment swatches

- **Labels**: `enhancement`, `docs`
- **Owner**: playground-engineer
- **Status**: the swatch now shows the active theme's `wheelPalette` color; the E2E assertion is
  still missing.
- **Acceptance criteria**: A segment without its own color shows the theme palette color it
  inherits; an E2E assertion covers it.

### Embedded Sandpack editor

- **Labels**: `docs`, `decision`
- **Owner**: playground-engineer
- **Context**: B2 deferred an in-page editor in favour of the StackBlitz handoff.
- **Acceptance criteria**: A recorded decision; if adopted, the editor runs in an isolated origin and
  adds no runtime dependency to published packages.

### Widen browser E2E coverage

- **Labels**: `ci`, `testing`
- **Owner**: qa-engineer
- **Acceptance criteria**: `firefox` and `webkit` added to the CI matrix (or a scheduled job), with
  known engine differences recorded.

### Expo QR previews

- **Labels**: `infra`, `docs`
- **Owner**: devops-engineer (_human gate_: needs an EAS project)
- **Acceptance criteria**: An EAS update channel publishes the gallery; game pages show a QR code
  next to the React Native preview.

### Companion consumer repositories at 1.1.0

- **Labels**: `testing`, `release`
- **Owner**: react-native-specialist
- **Context**: C2: `jackpotkit-web` and `jackpotkit-app` pin 1.0.0.
- **Acceptance criteria**: Both run as scheduled published-package smoke tests against the latest
  release.
