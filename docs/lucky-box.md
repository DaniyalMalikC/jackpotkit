---
title: Lucky Box
sidebar_position: 10
---

# Lucky Box

Lucky Box separates the box a user selects from the random, controlled, or provider-supplied winning box. This supports gifts, doors, envelopes, and other pick-and-reveal experiences without conflating interaction with outcome selection.

## Headless engine

```ts
import { createLuckyBox } from '@jackpotkit/core/lucky-box';

const game = createLuckyBox({
  boxes: [
    { id: 'violet', reward: { badge: 'vip' } },
    { id: 'gold' },
    { id: 'locked', disabled: true },
  ],
});

game.select('violet');
game.reveal();
// or game.revealTo({ boxId: 'gold' })
// or await game.revealWith(resultProvider, request)
game.reset();
```

Disabled boxes cannot be selected or win. The immutable result includes `selectedBox`, `winningBox`, `won`, and the optional reward only when the selected box wins.

## React Native

```tsx
import { LuckyBox } from '@jackpotkit/react-native/lucky-box';

<LuckyBox boxes={boxes} result={{ boxId: 'gold' }} onComplete={(result) => save(result)} />;
```

Users select an enabled box and activate Reveal. `renderBox` supports custom visuals; default content shows selection, availability, and the winning box without relying only on color. `useLuckyBox` exposes `select`, `reveal`, `revealTo`, `pick`, and `reset`; `LuckyBoxRef` provides the same imperative operations.

The responsive grid supports custom columns, themes, duration/easing, disabled state, reduced motion, lifecycle callbacks, screen-reader state, and result announcements. Reset invalidates pending provider work and active animation.

## React web

```tsx
import { LuckyBox } from '@jackpotkit/react/lucky-box';

<LuckyBox boxes={boxes} result={{ boxId: 'gold' }} />;
```

The web grid uses native selection buttons and CSS transform motion. `renderBox`, `useLuckyBox`,
imperative play/reset methods, result-provider behavior, disabled boxes, themes, and lifecycle events
remain aligned with the React Native surface while the implementation stays independent.

`@jackpotkit/testing` exports `createLuckyBoxes`. For rewards with value, the backend must own eligibility, result choice, persistence, and replay protection; the chosen UI box is not an authority boundary.
