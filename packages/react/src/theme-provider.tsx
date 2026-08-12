import { defaultTheme, type JackpotTheme } from '@jackpotkit/theme';
import { createContext, use, type ReactNode } from 'react';

const JackpotKitThemeContext = createContext<JackpotTheme>(defaultTheme);

export interface JackpotKitProviderProps {
  readonly children: ReactNode;
  readonly theme?: JackpotTheme;
}

export function JackpotKitProvider({ children, theme = defaultTheme }: JackpotKitProviderProps) {
  return (
    <JackpotKitThemeContext.Provider value={theme}>{children}</JackpotKitThemeContext.Provider>
  );
}

export function useJackpotKitTheme(): JackpotTheme {
  return use(JackpotKitThemeContext);
}
