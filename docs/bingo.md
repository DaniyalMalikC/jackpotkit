---
title: Bingo
sidebar_position: 7
---

# Bingo

Bingo is a persistent, number-based game rather than a one-shot animation. The pure TypeScript engine owns card generation, calls, marks, immutable state snapshots, and pattern evaluation. React Native renders that state and adds accessible interaction and lightweight mark transitions.

## Installation

```bash
npm install @jackpotkit/react-native @jackpotkit/core @jackpotkit/theme react-native-reanimated react-native-worklets
```

Expo applications should resolve native animation peers with Expo:

```bash
npx expo install react-native-reanimated react-native-worklets
```

## Basic component

```tsx
import { Bingo, type BingoRef } from '@jackpotkit/react-native/bingo';

const ref = useRef<BingoRef>(null);

<Bingo
  ref={ref}
  onCall={(number) => console.log('Called', number)}
  onComplete={(result) => console.log(result.matches)}
/>;

ref.current?.call(27);
ref.current?.mark(27);
ref.current?.check();
ref.current?.reset();
```

The default is a classic `5 × 5` card using numbers `1–75`, column-specific ranges, a center free space, and row, column, and diagonal completion patterns.

## Headless engine

```ts
import { SeededRandomSource } from '@jackpotkit/core';
import { createBingo } from '@jackpotkit/core/bingo';

const bingo = createBingo({
  randomSource: new SeededRandomSource('campaign-preview'),
});

bingo.call(27);
bingo.mark(27);

const check = bingo.check();
const snapshot = bingo.state;
```

`call()`, `mark()`, `unmark()`, and `reset()` replace internal sets and expose new frozen snapshots. Repeating a call or mark is idempotent, so called and marked number lists never contain duplicates. A number must be called and present on the card before it can be marked.

`draw()` chooses uniformly from the remaining configured number range. Injected seeded randomness makes full card and draw sequences repeatable for testing; it is not a security boundary.

## Generated and supplied cards

Generate a standalone card:

```ts
import { createBingoBoard } from '@jackpotkit/core/bingo';

const board = createBingoBoard({
  size: 3,
  minNumber: 1,
  maxNumber: 45,
  randomSource: new SeededRandomSource('small-card'),
});
```

Or provide a row-major card, using the string `free` for its center:

```ts
const board = [
  [1, 16, 31],
  [2, 'free', 32],
  [3, 18, 33],
] as const;

const bingo = createBingo({ board, size: 3, maxNumber: 45 });
```

Board validation rejects incorrect dimensions, duplicate numbers, values outside the configured range, and missing or misplaced free spaces. Free spaces require an odd board size; use `freeSpace: false` for even boards.

## Completion patterns

Built-in pattern names expand into concrete cell sets:

```ts
const bingo = createBingo({
  patterns: ['row', 'column', 'diagonal', 'four-corners', 'full-board'],
});
```

- `row` creates one pattern per row.
- `column` creates one pattern per column.
- `diagonal` creates both diagonals.
- `four-corners` creates one corner pattern.
- `full-board` creates a blackout pattern.

Custom patterns use zero-based row and column coordinates:

```ts
const bingo = createBingo({
  patterns: [
    {
      id: 'postage-stamp',
      label: 'Top-left postage stamp',
      cells: [
        { row: 0, column: 0 },
        { row: 0, column: 1 },
        { row: 1, column: 0 },
        { row: 1, column: 1 },
      ],
    },
  ],
});
```

Empty patterns, duplicate IDs or coordinates, and out-of-range coordinates fail with `InvalidConfigurationError`.

## Hook API

```tsx
const {
  board,
  patterns,
  state,
  status,
  result,
  error,
  call,
  draw,
  mark,
  unmark,
  toggleMark,
  check,
  reset,
} = useBingo({ randomSource });
```

The hook exposes engine state without animation timing. `onCall`, `onMark`, `onUnmark`, `onComplete`, `onReset`, `onError`, `onStatusChange`, and `onEvent` integrate with application state and analytics. JackpotKit itself emits no telemetry.

## Component API

| Prop                                        | Purpose                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| `board`                                     | Optional externally supplied row-major card.                                |
| `size`, `minNumber`, `maxNumber`            | Generated or supplied card dimensions and call range.                       |
| `freeSpace`                                 | Enables the center free cell on odd-sized cards.                            |
| `patterns`                                  | Built-in names or custom coordinate patterns.                               |
| `randomSource`                              | Injectable card and call randomness.                                        |
| `renderCell`                                | Custom React Native cell content.                                           |
| `showCallButton`                            | Shows or hides the built-in call control.                                   |
| `cellGap`, `width`, `theme`, `style`        | Responsive presentation controls.                                           |
| `reduceMotion`                              | Uses the short reduced-motion mark transition.                              |
| `disabled`                                  | Prevents calling and marking.                                               |
| `accessibilityLabel`, `accessibilityLabels` | Overrides board, call, cell, and completion descriptions.                   |
| Lifecycle callbacks / `onEvent`             | Ready, number call, mark, unmark, complete, reset, and error notifications. |

## Custom cells

```tsx
<Bingo
  renderCell={({ value, marked, theme }) => (
    <Text style={{ color: marked ? theme.colors.onPrimary : theme.colors.text }}>
      {value === 'free' ? '★' : marked ? `✓ ${value}` : value}
    </Text>
  )}
/>
```

The engine never imports images, fonts, or platform APIs. Custom cells remain responsible for contrast, readable labels, and non-color-only state.

## Accessibility and persistence

- Every numeric cell reports its called, marked, and disabled state.
- Uncalled cells and the automatic free space cannot be activated accidentally.
- Calls and completion are announced to screen readers.
- System reduced-motion preference is honored unless explicitly overridden.
- `state` is a frozen, serializable snapshot. Applications own storage; replay saved calls and marks into a validated card when restoring a session.

## Authoritative calls

For valuable rewards or shared games, the backend should own the call sequence. Pass validated server calls to `call(number)` and let users mark locally. `draw()` is appropriate for local games, previews, and tests, but is not cryptographically secure and must not prove entitlement. See [Server-authoritative results](./server-authoritative-results.md).

## Testing

`@jackpotkit/testing` exports `createBingoBoardFixture()` for compact supplied cards. Use `SeededRandomSource` or `SequenceRandomSource` for deterministic card and draw sequences. Assert engine patterns directly rather than relying on rendered colors or transition timing.

The Expo gallery demonstrates `3 × 3` and `5 × 5` cards, generated and supplied cards, two seeds, classic/corners/blackout patterns, controlled completion, custom cells, themes, reduced motion, reset, and local random calls.
