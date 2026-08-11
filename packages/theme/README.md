# @jackpotkit/theme

Platform-neutral theme contracts and lightweight presets for JackpotKit renderers.

```ts
import { createJackpotTheme, defaultTheme, neonTheme } from '@jackpotkit/theme';

const campaignTheme = createJackpotTheme({
  colors: { primary: '#0057FF', pointer: '#101828' },
  animation: { spinDuration: 2400 },
});
```

Themes contain colors, typography, spacing, radii, and animation defaults. They affect presentation only and never change selection probability or game results. `defaultTheme` and `neonTheme` are copied and frozen at their public boundaries.

Scratch Card uses `colors.scratchCover`, `colors.scratchAccent`, and `animation.revealDuration`. Theme overrides still affect presentation only; coverage and prize selection remain core state.

Slot Machine uses `colors.slotBackground`, `colors.slotAccent`, `animation.slotDuration`, and `animation.slotReelDelay`. These tokens control reel presentation and never influence grid selection or payline evaluation.

Bingo uses `colors.bingoFree`, `colors.bingoMarked`, and `animation.bingoMarkDuration`. These tokens style cells and transitions without changing calls, marks, or pattern evaluation.

Dice uses `colors.diceFace`, `colors.dicePip`, and `animation.diceRollDuration`. Coin Flip uses `colors.coinFront`, `colors.coinBack`, and `animation.coinFlipDuration`. Lucky Box uses `colors.luckyBox`, `colors.luckyBoxSelected`, and `animation.luckyBoxRevealDuration`. These tokens remain presentation-only.
