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
  createBingoBoardFixture,
  createCoinFaces,
  createDiceFixture,
  createGameResult,
  createLuckyBoxes,
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
const bingoBoard = createBingoBoardFixture(3);
const dice = createDiceFixture(2, 20);
const faces = createCoinFaces(['day', 'night']);
const boxes = createLuckyBoxes(3, (index) => ({ reward: index === 0 ? 'badge' : undefined }));
```

The package includes finite or looping random sequences, a call-capturing result provider, and deterministic result, reward, wheel-segment, Scratch Card selection, Slot Machine symbol, Bingo board, Dice, Coin Flip, and Lucky Box factories. It depends only on `@jackpotkit/core` and has no test-runner dependency.
