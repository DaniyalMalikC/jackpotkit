---
title: Core primitives
sidebar_position: 3
---

# Core primitives

`@jackpotkit/core` is an ESM-only, platform-independent TypeScript package. It has no runtime dependencies and does not initialize React, React Native, Expo, a browser, networking, storage, or telemetry.

```bash
npm install @jackpotkit/core
```

Shared primitives use the root entrypoint:

```ts
import { SeededRandomSource, type GameResult } from '@jackpotkit/core';
```

Implemented games add focused public subpaths. Spin Wheel is available from `@jackpotkit/core/spin-wheel` and Scratch Card from `@jackpotkit/core/scratch-card`; other internal paths remain unavailable.

## Results and rewards

`GameResult<TData>` is a generic immutable envelope. Games define the data they need without forcing monetary semantics:

```ts
import type { GameResult, Reward } from '@jackpotkit/core';

type WheelData = { segmentId: string };

const result: GameResult<WheelData> = {
  id: 'play-42',
  game: 'spin-wheel',
  data: { segmentId: 'bonus-points' },
  timestamp: Date.now(),
};

const reward: Reward<{ points: number }> = {
  id: 'bonus-points',
  label: 'Bonus points',
  value: { points: 100 },
};
```

These interfaces are readonly contracts. Consumers decide how results are validated, transported, and persisted.

## Lifecycle vocabulary and events

`GameStatus` provides a shared status vocabulary from `idle` through `completed`, `disabled`, and `error`. It is not a mandatory global transition machine; each game defines only valid transitions for its behavior.

`createGameEvent` produces a frozen, timestamped event envelope:

```ts
import { createGameEvent } from '@jackpotkit/core';

const event = createGameEvent(
  'result-resolved',
  { resultId: 'play-42' },
  { metadata: { campaignId: 'summer-2026' } },
);
```

JackpotKit does not install a global event bus. Applications route events using their own callbacks or state management.

## Random sources

Randomness is injectable through the small `RandomSource` contract:

```ts
import {
  MathRandomSource,
  SeededRandomSource,
  nextRandomValue,
  type RandomSource,
} from '@jackpotkit/core';

const ordinary = nextRandomValue(new MathRandomSource());

const first = new SeededRandomSource('preview');
const second = new SeededRandomSource('preview');
nextRandomValue(first) === nextRandomValue(second); // true

const custom: RandomSource = { next: () => 0.25 };
nextRandomValue(custom); // validates that the output is finite and in [0, 1)
```

`SeededRandomSource` uses an FNV-1a string hash and Mulberry32 generator. Equal seeds produce equal sequences across supported platforms, and `reset()` returns to the start of the sequence. This stability is useful for tests, previews, and debugging.

Neither `MathRandomSource` nor `SeededRandomSource` is cryptographically secure. Do not use client randomness to choose valuable, eligibility-controlled, or security-sensitive outcomes. Follow the [server-authoritative result boundary](./server-authoritative-results.md).

## Result providers

A `ResultProvider<TRequest, TResult>` is a consumer-supplied function. It may resolve synchronously or asynchronously:

```ts
import { resolveResult, type ResultProvider } from '@jackpotkit/core';

const provider: ResultProvider<string, { rewardId: string }> = async (campaignId) => {
  const response = await fetch(`/api/campaigns/${campaignId}/play`, { method: 'POST' });
  if (!response.ok) throw new Error('Play failed');
  return response.json() as Promise<{ rewardId: string }>;
};

const result = await resolveResult(provider, 'summer-2026');
```

`resolveResult` converts unknown provider failures into `ResultProviderError` while preserving the original `cause`. It does not perform networking or result-schema validation for you.

## Validation and errors

Validation results compose multiple actionable issues before throwing at a public boundary:

```ts
import { assertValidConfiguration, createValidationResult } from '@jackpotkit/core';

const validation = createValidationResult([
  { code: 'EMPTY_SEGMENTS', message: 'Add at least one segment.', path: ['segments'] },
]);

assertValidConfiguration(validation, 'Wheel configuration is invalid.');
```

Typed failures extend `JackpotKitError` and expose stable codes:

- `InvalidConfigurationError`
- `InvalidResultError`
- `ResultProviderError`
- `GameStateError`

Errors may carry readonly metadata and an underlying `cause`. Do not put credentials, personal data, or secrets in error metadata.

## Deterministic consumer tests

Install `@jackpotkit/testing` as a development dependency for finite or looping random sequences, call-capturing result providers, and result/reward factories:

```ts
import { SequenceRandomSource, createGameResult } from '@jackpotkit/testing';

const random = new SequenceRandomSource([0.1, 0.9]);
const result = createGameResult({ data: { rewardId: 'badge' } });
```
