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

Only the package root is public. Import from `@jackpotkit/core`; internal file paths and game subpaths are not supported.
