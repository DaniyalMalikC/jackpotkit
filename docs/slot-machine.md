---
title: Slot Machine
sidebar_position: 6
---

# Slot Machine

Slot Machine resolves a complete symbol grid before any reel moves. The pure TypeScript engine owns weighted selection, controlled and provider destinations, payline matching, and consumer-defined evaluation. Platform renderers only animate the known grid and highlight the evaluated result.

## Installation

```bash
npm install @jackpotkit/react-native @jackpotkit/core @jackpotkit/theme react-native-reanimated react-native-worklets
```

Expo projects should install animation peers through Expo's resolver:

```bash
npx expo install react-native-reanimated react-native-worklets
```

## Basic example

```tsx
import { SlotMachine } from '@jackpotkit/react-native/slot-machine';

const symbols = [
  { id: 'cherry', label: '🍒', weight: 5 },
  { id: 'star', label: '⭐', weight: 2 },
  { id: 'gift', label: '🎁', weight: 1 },
];

<SlotMachine
  symbols={symbols}
  reelCount={3}
  rowCount={3}
  onComplete={(result) => saveResult(result.data.reels)}
/>;
```

## React web

```tsx
import { SlotMachine } from '@jackpotkit/react/slot-machine';

<SlotMachine symbols={symbols} reelCount={3} rowCount={3} />;
```

The web renderer resolves the same reel-major core grid before applying staggered CSS transforms.
It exposes the same hook, imperative play/reset API, custom symbol callback, winning paylines,
reduced-motion behavior, and lifecycle events without native dependencies.

The grid is reel-major: `reels[reelIndex][rowIndex]`. A payline contains one row index per reel, so `[0, 1, 2]` describes a descending diagonal across three reels.

## Headless engine

```ts
import { SeededRandomSource } from '@jackpotkit/core';
import { createSlotMachine } from '@jackpotkit/core/slot-machine';

const machine = createSlotMachine({
  symbols,
  reelCount: 3,
  rowCount: 3,
  randomSource: new SeededRandomSource('preview'),
  paylines: [
    [0, 0, 0],
    [1, 1, 1],
    [2, 2, 2],
    [0, 1, 2],
    [2, 1, 0],
  ],
});

machine.spin();
machine.spinTo({
  reels: [
    ['star', 'cherry', 'gift'],
    ['star', 'gift', 'cherry'],
    ['star', 'cherry', 'gift'],
  ],
});
machine.reset();
```

Every visible cell is selected independently using the configured positive symbol weights. `SeededRandomSource` makes the sequence repeatable for tests and previews; it is not suitable for valuable outcomes.

## Paylines and evaluation

When `paylines` is omitted, the engine creates one straight payline per visible row. `evaluateSlotPaylines()` reports a win when every selected symbol along a payline has the same ID.

Business-specific result interpretation remains injectable and avoids hard-coded payouts:

```ts
const machine = createSlotMachine({
  symbols,
  reelCount: 3,
  evaluate: ({ winningPaylines }) => ({
    rewardTier: winningPaylines.some((line) => line.symbolId === 'gift')
      ? 'campaign-bonus'
      : 'standard',
    matchCount: winningPaylines.length,
  }),
});

const result = machine.spin();
result.evaluation?.rewardTier;
```

The evaluator receives frozen reels, configured paylines, and matching paylines. JackpotKit does not assign monetary payouts, balances, or settlement behavior.

## Controlled destination

```tsx
const result = {
  reels: [
    ['star', 'cherry', 'gift'],
    ['star', 'gift', 'cherry'],
    ['star', 'cherry', 'gift'],
  ],
};

<SlotMachine symbols={symbols} reelCount={3} result={result} />;
```

Selections must contain exactly `reelCount` columns and `rowCount` known symbol IDs per column. Invalid shapes and unknown IDs fail before animation.

## Server-authoritative destination

```tsx
const resultProvider = async () => {
  const response = await api.requestSlotPlay();
  return {
    reels: response.reels,
    metadata: { playId: response.playId },
  };
};

<SlotMachine
  symbols={symbols}
  reelCount={3}
  resultProvider={resultProvider}
  onComplete={(result) => acknowledge(result.metadata?.playId)}
/>;
```

The application owns transport validation, authentication, eligibility, idempotency, persistence, replay protection, and fulfilment. The component enters `requesting-result`, validates the returned grid, then starts its reel animation. See [Server-authoritative results](./server-authoritative-results.md).

## Hook and imperative API

```tsx
const { status, result, error, spin, spinTo, reset } = useSlotMachine({
  symbols,
  reelCount: 3,
});
```

The hook completes after result resolution because it has no renderer. The component's promise completes after the last reel stops:

```tsx
const ref = useRef<SlotMachineRef>(null);

<SlotMachine ref={ref} symbols={symbols} reelCount={3} />;

await ref.current?.spin();
await ref.current?.spinTo(controlledSelection);
ref.current?.reset();
```

Reset and unmount reject an active component animation promise with `AnimationError`.

## Component API

| Prop                                        | Purpose                                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `symbols`                                   | IDs, labels, values, positive weights, and metadata.                                            |
| `reelCount`, `rowCount`                     | Positive grid dimensions; rows default to `3`.                                                  |
| `paylines`                                  | One row index per reel; defaults to straight rows.                                              |
| `evaluate`                                  | Consumer-defined non-monetary interpretation of the matched grid.                               |
| `result`                                    | Controlled next symbol-ID grid.                                                                 |
| `resultProvider` / `resultRequest`          | Application-supplied synchronous or asynchronous destination.                                   |
| `randomSource`                              | Injectable client random source.                                                                |
| `duration`, `reelDelay`, `easing`           | Reel animation and stagger controls.                                                            |
| `reduceMotion`                              | Short transition with no stagger; system preference is used when omitted.                       |
| `renderSymbol`                              | Custom text, emoji, image, or branded React Native renderer.                                    |
| `symbolHeight`, `width`, `theme`, `style`   | Responsive presentation controls.                                                               |
| `disabled`, `status`                        | Disable play or present external status.                                                        |
| `accessibilityLabel`, `accessibilityLabels` | Override machine, action, busy, and result copy.                                                |
| Lifecycle callbacks / `onEvent`             | Ready, play, request, resolve, animation, reel stop, reveal, complete, reset, and error events. |

## Images and custom symbols

Use `renderSymbol` with the application's image component. Image sources stay out of core so the engine remains platform-independent:

```tsx
<SlotMachine
  symbols={symbols}
  reelCount={3}
  renderSymbol={({ symbol, winning }) => (
    <Image
      source={symbolImages[symbol.id]}
      style={{ height: 44, opacity: winning ? 1 : 0.8, width: 44 }}
    />
  )}
/>
```

## Accessibility and performance

- The spin control exposes button, busy, and disabled state.
- A polite live result and screen-reader announcement report matching paylines after the final reel stops.
- Default labels can be replaced with meaningful reward copy.
- Each reel owns its Reanimated shared value, so frame-by-frame translation does not update parent React state.
- Winning cells are determined by the engine, never by the animation's final pixel position.
- Custom renderers remain responsible for contrast, image descriptions, and non-color-only meaning.

## Testing

`@jackpotkit/testing` provides `createSlotSymbols`. Inject `SequenceRandomSource` for exact weighted outcomes, and use controlled grids instead of timing-based assertions for renderer tests.

The Expo gallery includes controls for reel count, row count, duration, random/controlled/server modes, straight or diagonal paylines, theme, reduced motion, and reset.
