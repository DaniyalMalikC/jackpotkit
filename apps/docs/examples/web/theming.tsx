import { JackpotKitProvider } from '@jackpotkit/react';
import { Dice } from '@jackpotkit/react/dice';
import { SpinWheel } from '@jackpotkit/react/spin-wheel';
import { createJackpotTheme, neonTheme } from '@jackpotkit/theme';

// #region create-theme
// A complete theme: every token not listed is copied from `neonTheme`.
export const brandTheme = createJackpotTheme(
  {
    colors: { primary: '#0F766E', onPrimary: '#FFFFFF', pointer: '#134E4A' },
    typography: { fontFamily: 'Inter, system-ui, sans-serif' },
    animation: { spinDuration: 2_400 },
  },
  neonTheme,
);
// #endregion create-theme

const segments = [
  { id: 'a', label: 'Teal' },
  { id: 'b', label: 'Amber' },
];

export function ThemedGames() {
  return (
    // #region provider
    <JackpotKitProvider theme={brandTheme}>
      <SpinWheel segments={segments} />
      {/* A per-component override is merged over the provider theme. */}
      <Dice count={2} theme={{ colors: { diceFace: '#FEF3C7', dicePip: '#78350F' } }} />
    </JackpotKitProvider>
    // #endregion provider
  );
}
