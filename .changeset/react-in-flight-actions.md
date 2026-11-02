---
'@jackpotkit/react': patch
---

Keep the primary action of Spin Wheel, Dice, Coin Flip, Slot Machine, and Lucky Box disabled for the
whole play, not only once the animation has started. A fast second click could previously resolve a
second result: in random mode `onComplete` reported the first result while the status text showed the
second, and Lucky Box reported a `GameStateError` through `onError`. The `disabled` prop no longer
marks the action as busy, so a disabled control keeps its idle label and `aria-busy="false"`.

Fix two accessible-name defects found by axe. Dice faces now use `role="img"`, so their `D6: n` label
is permitted and announced (WCAG 4.1.2). The Slot Machine spin button no longer overrides its visible
text with `aria-label="Spin reels"`; its accessible name is now the visible `PULL TO SPIN` /
`SPINNING…` text (WCAG 2.5.3). Tests or automation that query the `Spin reels` name must use the
visible text instead.

Preserve the generic signature of the `Dice` export, matching the other six games. Its props now
resolve to `DiceProps<TRequest>` (default `void`) instead of `DiceProps<unknown>`, so a `DiceProps`
object can be spread onto `<Dice>` under `exactOptionalPropertyTypes` and `<Dice<TRequest>>` accepts a
typed `resultProvider` and `resultRequest`.
