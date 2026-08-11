---
title: Coin Flip
sidebar_position: 9
---

# Coin Flip

Coin Flip models exactly two faces. The defaults are Heads and Tails, and applications can replace them with any two IDs, labels, values, and metadata.

## Headless engine

```ts
import { createCoinFlip } from '@jackpotkit/core/coin-flip';

const coin = createCoinFlip({
  faces: [
    { id: 'yes', value: true },
    { id: 'no', value: false },
  ],
});

coin.flip();
coin.flipTo({ faceId: 'yes' });
await coin.flipWith(resultProvider, request);
coin.reset();
```

Configuration rejects anything other than two unique non-empty face IDs. A result exposes the selected immutable face, its ID, and optional value.

## React Native

```tsx
import { CoinFlip } from '@jackpotkit/react-native/coin-flip';

<CoinFlip result={{ faceId: 'tails' }} onComplete={(result) => save(result.faceId)} />;
```

Use `renderFace` for branded artwork. `useCoinFlip` supplies a headless React Native lifecycle, and `CoinFlipRef` exposes `flip()`, `flipTo(selection)`, and `reset()`.

The transform-based animation honors system reduced motion and configurable duration/easing. The control reports busy and disabled state, the revealed face is visible text, and completion is announced. A custom renderer remains responsible for readable labels and contrast.

`@jackpotkit/testing` exports `createCoinFaces`. Random client flips are not proof of entitlement; use `resultProvider` for valuable outcomes.
