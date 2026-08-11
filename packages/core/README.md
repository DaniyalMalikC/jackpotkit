# @jackpotkit/core

Platform-independent TypeScript primitives for building deterministic, testable game mechanics.

```bash
npm install @jackpotkit/core
```

```ts
import {
  SeededRandomSource,
  createGameEvent,
  nextRandomValue,
  resolveResult,
  type GameResult,
  type ResultProvider,
} from '@jackpotkit/core';

const random = new SeededRandomSource('campaign-preview');
const sample = nextRandomValue(random); // always in [0, 1)

type PlayRequest = { campaignId: string };
type PlayData = { rewardId: string };

const provider: ResultProvider<PlayRequest, GameResult<PlayData>> = async (request) => {
  const response = await fetch(`/api/campaigns/${request.campaignId}/play`, {
    method: 'POST',
  });

  if (!response.ok) throw new Error('Play request failed');
  return response.json() as Promise<GameResult<PlayData>>;
};

const result = await resolveResult(provider, { campaignId: 'summer-2026' });
const event = createGameEvent('result-resolved', result);
```

## Included primitives

- Immutable result, reward, lifecycle, and typed event contracts.
- `MathRandomSource` for ordinary client-side variation.
- `SeededRandomSource` for reproducible previews, tests, and debugging.
- Injectable `RandomSource` contracts with range validation.
- Sync or async `ResultProvider` functions with normalized failures.
- Typed configuration, result, provider, and lifecycle errors.
- Composable validation results and assertion helpers.

`SeededRandomSource` uses a stable FNV-1a string hash and Mulberry32 generator. Its sequence is part of the public compatibility contract. It is deterministic, not cryptographically secure.

For rewards with real value, the backend must validate eligibility, choose and persist the outcome, and return that result. JackpotKit does not provide networking, settlement, fulfilment, or a security boundary.

Shared primitives are available from `@jackpotkit/core`; implemented games also have the intentional `@jackpotkit/core/spin-wheel`, `@jackpotkit/core/scratch-card`, `@jackpotkit/core/slot-machine`, and `@jackpotkit/core/bingo` subpaths. Other internal paths are unsupported.

## Spin Wheel

```ts
import { SeededRandomSource } from '@jackpotkit/core';
import { createSpinWheel } from '@jackpotkit/core/spin-wheel';

const wheel = createSpinWheel({
  segments: [
    { id: 'common', label: '10 points', weight: 9 },
    { id: 'rare', label: 'Bonus badge', weight: 1 },
  ],
  randomSource: new SeededRandomSource('preview'),
});

wheel.spin();
wheel.spinTo('rare');
await wheel.spinWith(serverResultProvider, request);
wheel.reset();
```

Weights affect selection probability only; every prebuilt visual slice remains equal. Controlled and server results are validated against configured segment IDs before animation.

## Scratch Card

```ts
import { createScratchCard, createScratchProgressTracker } from '@jackpotkit/core/scratch-card';

const card = createScratchCard({
  threshold: 0.65,
  result: { prize: { id: 'points', amount: 250 } },
});

const tracker = createScratchProgressTracker({
  width: 320,
  height: 180,
  brushRadius: 20,
});

card.start();
card.scratch(tracker.scratchLine({ x: 20, y: 40 }, { x: 280, y: 40 }));
card.reveal();
card.reset();
```

Coverage uses a deterministic grid and is independent of Skia, React Native, or frame rate. `startWith()` accepts a consumer-supplied result provider; scratching never chooses or changes the prize.

## Slot Machine

```ts
import { SeededRandomSource } from '@jackpotkit/core';
import { createSlotMachine } from '@jackpotkit/core/slot-machine';

const machine = createSlotMachine({
  symbols: [
    { id: 'cherry', weight: 5 },
    { id: 'star', weight: 1 },
  ],
  reelCount: 3,
  rowCount: 3,
  randomSource: new SeededRandomSource('preview'),
  paylines: [
    [0, 0, 0],
    [1, 1, 1],
    [2, 2, 2],
  ],
});

machine.spin();
machine.spinTo(controlledSelection);
await machine.spinWith(serverResultProvider, request);
machine.reset();
```

The grid is reel-major, and each payline contains one row index per reel. Built-in evaluation reports matching symbol IDs; optional consumer evaluation can add application-specific, non-monetary result metadata.

## Bingo

```ts
import { SeededRandomSource } from '@jackpotkit/core';
import { createBingo } from '@jackpotkit/core/bingo';

const bingo = createBingo({ randomSource: new SeededRandomSource('preview') });

bingo.call(27);
bingo.mark(27);
bingo.check();
bingo.reset();
```

Classic cards use a `5 × 5`, `1–75` layout with column ranges and a center free space. The engine also accepts externally supplied cards, configurable sizes and ranges, random remaining-number draws, mark/unmark, and row, column, diagonal, four-corners, full-board, or custom coordinate patterns. All exposed cards, patterns, results, and state snapshots are immutable.
