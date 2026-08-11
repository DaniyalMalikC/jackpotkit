export interface JackpotThemeColors {
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly mutedText: string;
  readonly primary: string;
  readonly onPrimary: string;
  readonly border: string;
  readonly pointer: string;
  readonly scratchAccent: string;
  readonly scratchCover: string;
  readonly wheelPalette: readonly string[];
}

export interface JackpotThemeTypography {
  readonly fontFamily?: string;
  readonly labelSize: number;
  readonly titleSize: number;
}

export interface JackpotThemeSpacing {
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
}

export interface JackpotThemeRadii {
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly full: number;
}

export interface JackpotThemeAnimation {
  readonly reducedMotionDuration: number;
  readonly revealDuration: number;
  readonly spinDuration: number;
  readonly spinRotations: number;
}

export interface JackpotTheme {
  readonly colors: JackpotThemeColors;
  readonly typography: JackpotThemeTypography;
  readonly spacing: JackpotThemeSpacing;
  readonly radii: JackpotThemeRadii;
  readonly animation: JackpotThemeAnimation;
}

export interface JackpotThemeOverride {
  readonly colors?: Partial<JackpotThemeColors>;
  readonly typography?: Partial<JackpotThemeTypography>;
  readonly spacing?: Partial<JackpotThemeSpacing>;
  readonly radii?: Partial<JackpotThemeRadii>;
  readonly animation?: Partial<JackpotThemeAnimation>;
}

function freezeTheme(theme: JackpotTheme): JackpotTheme {
  return Object.freeze({
    colors: Object.freeze({
      ...theme.colors,
      wheelPalette: Object.freeze([...theme.colors.wheelPalette]),
    }),
    typography: Object.freeze({ ...theme.typography }),
    spacing: Object.freeze({ ...theme.spacing }),
    radii: Object.freeze({ ...theme.radii }),
    animation: Object.freeze({ ...theme.animation }),
  });
}

export const defaultTheme: JackpotTheme = freezeTheme({
  colors: {
    background: '#F7F6FB',
    surface: '#FFFFFF',
    text: '#17142B',
    mutedText: '#68647A',
    primary: '#6843D5',
    onPrimary: '#FFFFFF',
    border: '#E5E0F1',
    pointer: '#25194D',
    scratchAccent: '#F3A712',
    scratchCover: '#77718A',
    wheelPalette: ['#6843D5', '#EB4D8A', '#F3A712', '#18A999', '#3F7CAC', '#9B5DE5'],
  },
  typography: {
    labelSize: 13,
    titleSize: 20,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 999,
  },
  animation: {
    reducedMotionDuration: 160,
    revealDuration: 320,
    spinDuration: 3_000,
    spinRotations: 6,
  },
});

export function createJackpotTheme(
  override: JackpotThemeOverride = {},
  base: JackpotTheme = defaultTheme,
): JackpotTheme {
  return freezeTheme({
    colors: { ...base.colors, ...override.colors },
    typography: { ...base.typography, ...override.typography },
    spacing: { ...base.spacing, ...override.spacing },
    radii: { ...base.radii, ...override.radii },
    animation: { ...base.animation, ...override.animation },
  });
}

export const neonTheme: JackpotTheme = createJackpotTheme({
  colors: {
    background: '#090617',
    surface: '#15102A',
    text: '#F8F5FF',
    mutedText: '#BDB2D9',
    primary: '#00E5FF',
    onPrimary: '#090617',
    border: '#3B2F61',
    pointer: '#FF3DCE',
    scratchAccent: '#00F5A0',
    scratchCover: '#4C3D73',
    wheelPalette: ['#FF3DCE', '#7B61FF', '#00E5FF', '#00F5A0', '#FFE66D', '#FF6B6B'],
  },
});
