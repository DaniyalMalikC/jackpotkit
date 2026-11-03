# @jackpotkit/react

## 1.1.1

### Patch Changes

- 6a2a8d2: Keep the primary action of Spin Wheel, Dice, Coin Flip, Slot Machine, and Lucky Box disabled for the
  whole play, not only once the animation has started. A fast second click could previously resolve a
  second result: in random mode `onComplete` reported the first result while the status text showed the
  second, and Lucky Box reported a `GameStateError` through `onError`. The `disabled` prop no longer
  marks the action as busy, so a disabled control keeps its idle label and `aria-busy="false"`.

  Fix two accessible-name defects found by axe. Dice faces now use `role="img"`, so their `D6: n` label
  is permitted and announced (WCAG 4.1.2). The Slot Machine spin button no longer overrides its visible
  text with `aria-label="Spin reels"`; its accessible name is now the visible `PULL TO SPIN` /
  `SPINNING…` text (WCAG 2.5.3). Tests or automation that query the `Spin reels` name must use the
  visible text instead.

  Preserve the generic signature of the `Dice` export, matching the other six games. Its props now
  resolve to `DiceProps<TRequest>` (default `void`) instead of `DiceProps<unknown>`, so a `DiceProps`
  object can be spread onto `<Dice>` under `exactOptionalPropertyTypes` and `<Dice<TRequest>>` accepts a
  typed `resultProvider` and `resultRequest`.

- 94242f2: Stop default Slot Machine symbol text from clipping in narrow reels. Symbol labels were sized from
  the cell height only, so text labels such as `Symbol 1` clipped at a 380px-wide, 3-reel layout. The
  default `symbol.label ?? symbol.id` text now also shrinks to the width of its reel cell, using CSS
  container query units, and a multi-word label may wrap onto two lines when the cell is tall enough.
  Short labels and emoji keep their previous size. Browsers without container query units keep the
  previous height-based size. Custom `renderSymbol` output and its cell are unchanged, and the API is
  unchanged.

## 1.1.0

### Minor Changes

- 3bc2988: Add selectable face styles for Dice and Coin Flip.
- 0b145a6: Improve Slot Machine and Slot Reel animation, symbol rendering, and accessibility.
- e56c471, 58d15b6: Add canvas-backed Scratch Card rendering with improved visuals and accessibility.
- 25c2316: Add gift-box visuals for Lucky Box.

### Patch Changes

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

## 0.1.0

### Minor Changes

- 77cc8e9: Add Phase 7 React web components and hooks for all seven games, exact subpath exports, SVG and Canvas
  rendering, Pointer Events, CSS transform motion, reduced-motion support, SSR-safe initialization,
  interactive Vite examples, tests, packaging checks, and documentation.

## 0.0.1

### Patch Changes

- 4fb870e: Correct the public Phase 0 documentation and canonical repository metadata following the initial npm publication.
