import { createJackpotTheme, type JackpotThemeOverride } from '@jackpotkit/theme';
import { useMemo } from 'react';

import { useJackpotKitTheme } from '../theme-provider.js';

export function useResolvedTheme(override?: JackpotThemeOverride) {
  const providerTheme = useJackpotKitTheme();
  return useMemo(() => createJackpotTheme(override, providerTheme), [override, providerTheme]);
}
