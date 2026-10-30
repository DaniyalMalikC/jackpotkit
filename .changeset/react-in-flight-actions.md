---
'@jackpotkit/react': patch
---

Keep the primary action of Spin Wheel, Dice, Coin Flip, Slot Machine, and Lucky Box disabled for the
whole play, not only once the animation has started. A fast second click could previously resolve a
second result: in random mode `onComplete` reported the first result while the status text showed the
second, and Lucky Box reported a `GameStateError` through `onError`. The `disabled` prop no longer
marks the action as busy, so a disabled control keeps its idle label and `aria-busy="false"`.
