import { JackpotKitProvider } from '@jackpotkit/react-native';
import { Dice } from '@jackpotkit/react-native/dice';
import { SpinWheel } from '@jackpotkit/react-native/spin-wheel';
import { createJackpotTheme, neonTheme } from '@jackpotkit/theme';

const brandTheme = createJackpotTheme({ colors: { primary: '#0F766E' } }, neonTheme);
const segments = [
  { id: 'a', label: 'Teal' },
  { id: 'b', label: 'Amber' },
];

export function ThemedGames() {
  return (
    <JackpotKitProvider theme={brandTheme}>
      <SpinWheel segments={segments} />
      <Dice count={2} theme={{ colors: { diceFace: '#FEF3C7', dicePip: '#78350F' } }} />
    </JackpotKitProvider>
  );
}
