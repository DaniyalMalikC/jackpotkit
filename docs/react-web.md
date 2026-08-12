---
title: React web renderers
sidebar_position: 11
---

# React web renderers

`@jackpotkit/react` implements all seven JackpotKit experiences directly for the browser. It does
not import, wrap, or alias `@jackpotkit/react-native`, and it has no Expo or native peer dependency.

## Installation

```bash
npm install @jackpotkit/react @jackpotkit/core @jackpotkit/theme react react-dom
```

Prefer exact subpaths so applications load only the games they use:

```tsx
import { ScratchCard } from '@jackpotkit/react/scratch-card';
import { SpinWheel } from '@jackpotkit/react/spin-wheel';
```

The root entrypoint remains available when an application intentionally wants several games and
also exports `JackpotKitProvider` and `useJackpotKitTheme`.

## Platform implementation

- Spin Wheel uses responsive SVG geometry and CSS rotation.
- Scratch Card erases a Canvas cover with Pointer Events and uses the deterministic core coverage
  tracker rather than pixel sampling.
- Slot Machine, Dice, Coin Flip, and Lucky Box use transform-based CSS motion.
- Bingo uses semantic HTML buttons, an immutable core state machine, and a responsive CSS grid.

Every renderer honors `prefers-reduced-motion` unless `reduceMotion` is supplied explicitly.
Presentation props use browser `className`, `CSSProperties`, and CSS transition timing strings.
Custom render callbacks receive ordinary React nodes and the resolved platform-neutral theme.

## SSR and result authority

Package initialization never accesses DOM globals. Canvas, image loading, media queries, and pointer
state are initialized only after the component mounts, so exact subpaths can be imported and
rendered by SSR frameworks.

The browser is not an authority boundary. Core resolves and validates a result before animation;
for anything with material value, provide a server-selected result through `resultProvider` and
persist it independently of the renderer. See [Server-authoritative results](./server-authoritative-results.md).

## Testing

Use controlled selections and zero-duration motion for component tests. Headless behavior belongs
in core tests; browser tests should focus on lifecycle parity, semantic controls, custom rendering,
Pointer Events, and the visible result. The repository also installs the packed package into an
isolated consumer and server-renders all seven exact subpaths without DOM globals.
