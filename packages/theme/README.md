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
