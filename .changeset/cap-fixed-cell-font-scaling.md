---
'@jackpotkit/react-native': patch
---

Stop default text from clipping inside fixed-size game cells at large accessibility text sizes. Slot
Machine symbols, Bingo cell numbers, numeric die faces, coin face text, and Spin Wheel segment and hub
labels now scale with the system text size up to 200% (or less when the cell is too short to hold
the text) and then shrink to fit. Font scaling stays enabled and accessibility labels are unchanged.
Custom `renderSymbol`, `renderCell`, `renderDie`, `renderFace`, and `renderSegment` output is not
affected.
