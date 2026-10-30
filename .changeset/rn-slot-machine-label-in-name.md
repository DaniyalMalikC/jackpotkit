---
'@jackpotkit/react-native': patch
---

Change the Slot Machine default spin labels from `Spin reels` / `Reels spinning` to `Pull to spin` /
`Spinning`, so the accessible name contains the visible `PULL TO SPIN` / `SPINNING…` text and
voice-control users can activate the button by what they see (WCAG 2.5.3). Pass
`accessibilityLabels.spin` and `accessibilityLabels.spinning` to keep custom copy.
