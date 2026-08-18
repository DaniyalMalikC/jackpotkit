---
'@jackpotkit/react-native': patch
---

Prevent native Hermes/Worklets crashes when Dice, Coin Flip, and Lucky Box animations complete by
scheduling stable JavaScript-thread callback references instead of locally defined worklet
closures.
