---
title: Dice
sidebar_position: 8
---

# Dice

Dice supports D4, D6, D8, D10, D12, D20, custom side counts, and multiple mixed dice. Core resolves every value before React Native starts its roll animation.

## Headless engine

```ts
import { createDice } from '@jackpotkit/core/dice';

const dice = createDice({ count: 2, sides: 6 });
dice.roll();
dice.rollTo({ values: [2, 6] });
await dice.rollWith(resultProvider, request);
dice.reset();
```

Use `dice: [{ id: 'd4', sides: 4 }, { id: 'd20', sides: 20 }]` for mixed or custom definitions. Values must be integers within each corresponding die's bounds. Results expose immutable `dice`, `values`, and `total` fields.

## React Native

```tsx
import { Dice } from '@jackpotkit/react-native/dice';

<Dice count={2} sides={6} faceStyle="pips" onComplete={(result) => save(result.values)} />;
```

`result={{ values }}` controls the next roll, while `resultProvider` requests an application-owned result. `useDice` provides the same flow without rendering. `DiceRef` exposes `roll()`, `rollTo(selection)`, and `reset()`.

Use `faceStyle="numbers"` for numeric faces (the backwards-compatible default) or
`faceStyle="pips"` for conventional D6 pips and beveled numeric faces on other dice. The component also supports
`renderDie`, responsive width, duration/easing, themes, disabled state, reduced motion, lifecycle
callbacks, typed events, visible totals, and screen-reader announcements. Custom dice must preserve
readable values, labels, contrast, and non-color-only state.

## React web

```tsx
import { Dice } from '@jackpotkit/react/dice';

<Dice count={2} sides={6} faceStyle="pips" result={{ values: [2, 6] }} />;
```

The independent web component and `useDice` hook preserve the same core outcomes and lifecycle.
Dice motion uses an upright lift, tumble, and settle sequence, default controls are semantic
buttons, and `easing` accepts a CSS transition timing function. Web supports the same `numbers` and
`pips` face styles as React Native.

## Testing and authority

`@jackpotkit/testing` exports `createDiceFixture` and deterministic random sources. Assert exact values and totals, not animation timing. Client rolls are appropriate for ordinary games and previews; valuable outcomes must come from an authoritative provider.
