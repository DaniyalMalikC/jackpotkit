---
'@jackpotkit/react-native': patch
---

Preserve the generic signature of the `Dice` export, matching the other six games. Its props now
resolve to `DiceProps<TRequest>` (default `void`) instead of `DiceProps<unknown>`, so a `DiceProps`
object can be spread onto `<Dice>` under `exactOptionalPropertyTypes` and `<Dice<TRequest>>` accepts a
typed `resultProvider` and `resultRequest`.
