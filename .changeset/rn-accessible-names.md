---
'@jackpotkit/react-native': patch
---

Make default accessible names contain the visible text of their controls (WCAG 2.5.3, Label in
Name), and give default die faces an image role. Consumer `accessibilityLabels` overrides are
unchanged; only defaults change. Tests that query the old default labels must be updated.

- **Scratch Card**: the cover is now the accessible button (`testID="jackpotkit-scratch-card"`
  moved with it; the outer wrapper is `jackpotkit-scratch-card-container`). Its default name is
  `Scratch Card` (or `accessibilityLabel` / `accessibilityLabels.card`), and the scratch progress
  (`accessibilityLabels.progress`) is reported as its accessibility value instead of being appended
  to the name. Previously the name was `Scratch Card. N percent scratched.`. The prize content is a
  sibling of the cover and stays hidden from screen readers until the reveal starts (or the
  threshold completes with `autoReveal={false}`), so the outcome is never announced early; after
  that it is readable text.
- **Bingo**: the call button's default name is its visible text (`Call next number`,
  `Last call: n`, or `All numbers called`) instead of `Call next Bingo number`, with the hint
  `Calls the next number` after the first call. `accessibilityLabels.call` still replaces the name.
- **Lucky Box**: the reveal button is named `Reveal selection` (`Revealing` while busy) instead of
  `Reveal Lucky Box` / `Revealing Lucky Box`, with the hint `Reveals the Lucky Box result`. Boxes
  that are unavailable add `, unavailable` to their name (for example `Locked gift, unavailable`).
- **Dice**: each default die face is an accessible element with the `image` role, so
  react-native-web no longer emits `aria-label` on a role-less `div` and native screen readers
  announce the face as one image named, for example, `D6: 5`.
