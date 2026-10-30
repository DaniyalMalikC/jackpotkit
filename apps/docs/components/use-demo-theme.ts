'use client';

import { neonTheme, type JackpotThemeOverride } from '@jackpotkit/theme';
import { useTheme } from 'next-themes';

/**
 * Picks a JackpotKit theme that matches the site colour scheme: the package default in light
 * mode and the shipped `neonTheme` preset in dark mode.
 */
export function useDemoTheme(): JackpotThemeOverride | undefined {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? neonTheme : undefined;
}
