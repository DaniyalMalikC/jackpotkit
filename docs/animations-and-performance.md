---
title: Animations and performance
description: What drives animation on each platform, reduced motion, bundle size with exact subpath imports, and keeping Skia out of apps that do not need it.
---

# Animations and performance

Outcomes are resolved by the core engines before any animation starts. Animation only moves the
presentation to a destination that is already known, so dropped frames, a background tab, or a
reset never change a result.

## What drives animation

| Game         | React web                               | React Native                                   |
| ------------ | --------------------------------------- | ---------------------------------------------- |
| Spin Wheel   | SVG slices, CSS `transform` transition  | `react-native-svg` slices, Reanimated rotation |
| Scratch Card | HTML Canvas erasure with Pointer Events | Skia canvas with a Gesture Handler pan gesture |
| Slot Machine | CSS transforms, staggered per reel      | Reanimated reels, staggered per reel           |
| Bingo        | CSS transitions on semantic buttons     | Reanimated mark transition                     |
| Dice         | CSS transforms (lift, tumble, settle)   | Reanimated transforms                          |
| Coin Flip    | CSS 3D transform with two faces         | Reanimated transforms                          |
| Lucky Box    | CSS transforms                          | Reanimated transforms                          |

On React Native, Reanimated runs animations on the UI thread through worklets, and the components
do not update React state on animation frames. Completion is scheduled back to the JavaScript thread
once, when the animation ends. On the web, the browser's compositor runs the CSS transitions.

Durations come from the component props or the theme's `animation` tokens
([Theming](./theming.mdx#animation)). `reset()` and unmounting cancel active animations on both
platforms.

## Reduced motion

Every game follows the system setting and uses the theme's `reducedMotionDuration` (160 ms by
default) instead of the full animation. The `reduceMotion` prop behaves slightly differently on the
two platforms; see the [Reduced motion recipe](./recipes/reduced-motion.mdx).

## Bundle size: import exact subpaths

Every package has `"sideEffects": false` and one subpath per game. Import the games you use from
their subpaths:

```tsx
import { SpinWheel } from '@jackpotkit/react/spin-wheel';
import { createSpinWheel } from '@jackpotkit/core/spin-wheel';
```

The root entrypoints (`@jackpotkit/react`, `@jackpotkit/react-native`, `@jackpotkit/core`) re-export
every game. Bundlers that tree-shake ES modules drop unused games either way, but subpaths keep
development builds, Metro bundles, and type checking smaller, and they make code splitting by game
straightforward (for example `next/dynamic` or `React.lazy` around one game).

## Skia only for Scratch Card

`@jackpotkit/react-native` imports `@shopify/react-native-skia` only from
`@jackpotkit/react-native/scratch-card`, and the package root does not export Scratch Card. Apps that
never import that subpath do not need Skia installed and never load it.

On the web (Expo web), Skia also needs the CanvasKit WebAssembly build, about 8 MB. Load Scratch Card
lazily behind `WithSkiaWeb` so other routes never download it
([Scratch Card: Expo web](./scratch-card.mdx#expo-web)). React web apps should use
`@jackpotkit/react/scratch-card`, which uses an HTML Canvas and has no WebAssembly.

## Tips

- Keep `segments`, `symbols`, `boxes`, `faces`, and `dice` arrays stable between renders (module
  constants or `useMemo`). A new array is a new configuration.
- Keep one `randomSource` instance per game; creating one on every render restarts a seeded
  sequence.
- Debounce or sample Scratch Card `onProgress` work; it fires while the player scratches.
- Custom renderers run for every segment, symbol, cell, or box. Keep them cheap and avoid creating
  images or fonts inside them.
