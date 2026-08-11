# @jackpotkit/testing

Deterministic testing utilities for JackpotKit consumers.

```bash
npm install --save-dev @jackpotkit/testing
```

```ts
import { resolveResult } from '@jackpotkit/core';
import {
  MockResultProvider,
  SequenceRandomSource,
  createGameResult,
  createScratchCardSelection,
  createSlotSymbols,
  createWheelSegments,
} from '@jackpotkit/testing';

const random = new SequenceRandomSource([0.1, 0.8]);
random.next(); // 0.1
random.next(); // 0.8

const mock = new MockResultProvider({
  result: createGameResult({ data: { rewardId: 'bonus-points' } }),
});

const result = await resolveResult(mock.provide, { campaignId: 'test' });
mock.calls; // 1
mock.requests; // [{ campaignId: 'test' }]

const segments = createWheelSegments(4, (index) => ({ weight: index + 1 }));
const scratchSelection = createScratchCardSelection(
  { id: 'bonus-points', amount: 250 },
  { metadata: { authority: 'fixture' } },
);
const symbols = createSlotSymbols(5, (index) => ({ weight: index + 1 }));
```

The package includes finite or looping random sequences, a call-capturing result provider, and deterministic result, reward, wheel-segment, Scratch Card selection, and Slot Machine symbol factories. It depends only on `@jackpotkit/core` and has no test-runner dependency.
