import {
  createJackpotTheme,
  type JackpotTheme,
  type JackpotThemeOverride,
} from '@jackpotkit/theme';

export type BrandScheme = 'light' | 'dark';

/**
 * The documentation site's brand theme for the live demos, built only with the public
 * `createJackpotTheme` API. It is a site choice, not a library preset: the package's
 * `defaultTheme` and `neonTheme` are unchanged and stay selectable in the playground.
 *
 * Palette: vanilla #F7EDB9, cream #FFFDD0, bright pink #D7707C, amaranth #A42E4A, burgundy
 * #800020. Wheel labels use `onPrimary` on every segment, so the light wheel uses dark segments
 * under cream labels (at least 4.8:1) and the dark wheel uses light segments under near-black
 * labels (at least 6.0:1). Bright pink is never used for text on cream (3.1:1).
 */
export const brandThemeOverrides: Readonly<Record<BrandScheme, JackpotThemeOverride>> = {
  light: {
    colors: {
      background: '#FFFDD0',
      surface: '#FFFEF2',
      text: '#2A0A12',
      mutedText: '#6E3A45',
      primary: '#800020',
      onPrimary: '#FFFDD0',
      border: '#E6D39C',
      bingoFree: '#F7EDB9',
      bingoMarked: '#A42E4A',
      coinBack: '#800020',
      coinFront: '#F7EDB9',
      diceFace: '#FFFEF2',
      dicePip: '#800020',
      luckyBox: '#FFFEF2',
      luckyBoxSelected: '#F7EDB9',
      pointer: '#2A0A12',
      scratchAccent: '#D7707C',
      scratchCover: '#A42E4A',
      slotAccent: '#A42E4A',
      slotBackground: '#4A0013',
      wheelPalette: ['#800020', '#B0505E', '#5C0A1F', '#A42E4A', '#6B1530', '#9C4050'],
    },
  },
  dark: {
    colors: {
      background: '#170A0E',
      surface: '#2A121A',
      text: '#FFFDD0',
      mutedText: '#D9BFA8',
      primary: '#D7707C',
      onPrimary: '#1A0509',
      border: '#4A2530',
      bingoFree: '#800020',
      bingoMarked: '#D7707C',
      coinBack: '#A42E4A',
      coinFront: '#F7EDB9',
      diceFace: '#2A121A',
      dicePip: '#F7EDB9',
      luckyBox: '#2A121A',
      luckyBoxSelected: '#800020',
      pointer: '#F7EDB9',
      scratchAccent: '#D7707C',
      scratchCover: '#A42E4A',
      slotAccent: '#D7707C',
      slotBackground: '#2A0D16',
      wheelPalette: ['#D7707C', '#F7EDB9', '#E8A0A8', '#FFFDD0', '#E3868F', '#EFD9A8'],
    },
  },
};

export const brandThemes: Readonly<Record<BrandScheme, JackpotTheme>> = {
  light: createJackpotTheme(brandThemeOverrides.light),
  dark: createJackpotTheme(brandThemeOverrides.dark),
};
