'use client';

import type { JackpotTheme } from '@jackpotkit/theme';
import { useTheme } from 'next-themes';

import { brandThemes } from '@/lib/brand-theme';

/**
 * Picks the site brand theme (`lib/brand-theme.ts`, built with `createJackpotTheme`) that matches
 * the site colour scheme.
 */
export function useDemoTheme(): JackpotTheme {
  const { resolvedTheme } = useTheme();
  return brandThemes[resolvedTheme === 'dark' ? 'dark' : 'light'];
}
