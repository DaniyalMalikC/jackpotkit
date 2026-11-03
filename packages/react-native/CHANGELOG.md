# @jackpotkit/react-native

## 1.1.1

### Patch Changes

- 65b6dd7: Stop default text from clipping inside fixed-size game cells at large accessibility text sizes. Slot
  Machine symbols, Bingo cell numbers, numeric die faces, coin face text, and Spin Wheel segment and hub
  labels now scale with the system text size up to 200% (or less when the cell is too short to hold
  the text) and then shrink to fit. Font scaling stays enabled and accessibility labels are unchanged.
  Custom `renderSymbol`, `renderCell`, `renderDie`, `renderFace`, and `renderSegment` output is not
  affected.
- 76bf177: Make default accessible names contain the visible text of their controls (WCAG 2.5.3, Label in
  Name), and give default die faces an image role. Consumer `accessibilityLabels` overrides are
  unchanged; only defaults change. Tests that query the old default labels must be updated.

  - **Scratch Card**: the cover is now the accessible button (`testID="jackpotkit-scratch-card"`
    moved with it; the outer wrapper is `jackpotkit-scratch-card-container`). Its default name is
    `Scratch Card` (or `accessibilityLabel` / `accessibilityLabels.card`), and the scratch progress
    (`accessibilityLabels.progress`) is reported as its accessibility value instead of being appended
    to the name. Previously the name was `Scratch Card. N percent scratched.`. The prize content is a
    sibling of the cover and stays hidden from screen readers until the reveal starts (or the
    threshold completes with `autoReveal={false}`), so the outcome is never announced early; after
    that it is readable text.
  - **Bingo**: the call button's default name is its visible text (`Call next number`,
    `Last call: n`, or `All numbers called`) instead of `Call next Bingo number`, with the hint
    `Calls the next number` after the first call. `accessibilityLabels.call` still replaces the name.
  - **Lucky Box**: the reveal button is named `Reveal selection` (`Revealing` while busy) instead of
    `Reveal Lucky Box` / `Revealing Lucky Box`, with the hint `Reveals the Lucky Box result`. Boxes
    that are unavailable add `, unavailable` to their name (for example `Locked gift, unavailable`).
  - **Dice**: each default die face is an accessible element with the `image` role, so
    react-native-web no longer emits `aria-label` on a role-less `div` and native screen readers
    announce the face as one image named, for example, `D6: 5`.

- 4a35acb: Preserve the generic signature of the `Dice` export, matching the other six games. Its props now
  resolve to `DiceProps<TRequest>` (default `void`) instead of `DiceProps<unknown>`, so a `DiceProps`
  object can be spread onto `<Dice>` under `exactOptionalPropertyTypes` and `<Dice<TRequest>>` accepts a
  typed `resultProvider` and `resultRequest`.
- 9434f80: Change the Slot Machine default spin labels from `Spin reels` / `Reels spinning` to `Pull to spin` /
  `Spinning`, so the accessible name contains the visible `PULL TO SPIN` / `SPINNING…` text and
  voice-control users can activate the button by what they see (WCAG 2.5.3). Pass
  `accessibilityLabels.spin` and `accessibilityLabels.spinning` to keep custom copy.

## 1.1.0

### Minor Changes

- 3bc2988: Add selectable face styles for Dice and Coin Flip.
- 0b145a6: Improve Slot Machine and Slot Reel animation, symbol rendering, and accessibility.
- e56c471: Improve Scratch Card rendering and scratch effects.
- 25c2316, f657509: Add gift-box visuals for Lucky Box and reliably reset its selection state.

### Patch Changes

- 90ca202: Prevent native Hermes/Worklets crashes when Dice, Coin Flip, and Lucky Box animations complete by
  scheduling stable JavaScript-thread callback references instead of locally defined worklet
  closures.
- Keep Coin Flip face content readable when the preferred theme color does not meet WCAG contrast.

## 1.0.0

### Major Changes

- 4800f2b: Declare the stable 1.0 public API candidate and add Phase 8 release hardening: package-type analysis,
  dependency and privacy allowlists, automated web accessibility auditing, migration and compatibility
  policy, dependency review, release-readiness gates, and hardened trusted publication validation.

### Patch Changes

- Updated dependencies [4800f2b]
  - @jackpotkit/core@1.0.0
  - @jackpotkit/theme@1.0.0

## 0.3.0

### Minor Changes

- d06983a: Add Phase 6 Dice, Coin Flip, and Lucky Box engines; exact random, controlled, and provider results; accessible animated React Native components and hooks; theme tokens; deterministic testing factories; Expo playgrounds; and public documentation.

### Patch Changes

- Updated dependencies [d06983a]
  - @jackpotkit/core@0.3.0
  - @jackpotkit/theme@0.3.0

## 0.2.0

### Minor Changes

- fde1224: Add the Phase 5 Bingo engine, seeded classic card generation, supplied cards, immutable calls and marks, built-in and custom pattern detection, accessible React Native board and hook, theme tokens, testing fixture, Expo playground, and public documentation.
- 70b5583: Add the Phase 4 Slot Machine engine, weighted grids, custom paylines and evaluation, controlled and provider destinations, staggered React Native reels, theme tokens, testing factory, Expo playground, and public documentation.
- d0535f0: Add the Phase 3 Scratch Card engine, deterministic progress tracker, isolated Skia React Native renderer and hook, theme tokens, testing factory, Expo playground, and public documentation.

### Patch Changes

- Updated dependencies [fde1224]
- Updated dependencies [70b5583]
- Updated dependencies [d0535f0]
  - @jackpotkit/core@0.2.0
  - @jackpotkit/theme@0.2.0

## 0.1.0

### Minor Changes

- 7a29cde: Add Spin Wheel as the first end-to-end reference game.

  The release includes a pure headless engine with weighted, controlled, and server-authoritative results; exact destination math; a React Native hook and accessible Reanimated/SVG component; imperative controls; reduced motion; platform-neutral default and neon themes; deterministic wheel factories; an interactive Expo playground; and complete game documentation.

### Patch Changes

- Updated dependencies [0c7d26f]
- Updated dependencies [7a29cde]
  - @jackpotkit/core@0.1.0
  - @jackpotkit/theme@0.1.0

## 0.0.1

### Patch Changes

- 4fb870e: Correct the public Phase 0 documentation and canonical repository metadata following the initial npm publication.
