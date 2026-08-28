# @jackpotkit/react-native

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
