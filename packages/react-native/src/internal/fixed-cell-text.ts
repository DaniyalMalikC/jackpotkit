/**
 * Font-scaling limits for default text drawn inside fixed-geometry game cells: Slot Machine reel
 * cells, Bingo squares, numeric die faces, coin faces, and Spin Wheel labels and hub.
 *
 * System font scaling stays enabled (`allowFontScaling` is never turned off). Text grows with the
 * user's text-size setting up to {@link FIXED_CELL_MAX_FONT_SIZE_MULTIPLIER} (200%, the WCAG 1.4.4
 * resize-text level) or until it would no longer fit the cell height, whichever is smaller, and then
 * shrinks to fit the cell width. Without a cap, the largest iOS accessibility sizes scale text past
 * the cell and clip it. The text content is unchanged, so screen readers announce the same labels.
 */
import type { TextProps } from 'react-native';

/** Highest font-size multiplier applied to text inside fixed-size cells. */
export const FIXED_CELL_MAX_FONT_SIZE_MULTIPLIER = 2;

/** Smallest scale `adjustsFontSizeToFit` may shrink fixed-cell text to. */
export const FIXED_CELL_MINIMUM_FONT_SCALE = 0.5;

/** Approximate rendered line height as a multiple of the font size. */
const LINE_HEIGHT_RATIO = 1.25;

/**
 * Returns the font-size multiplier cap for text of `fontSize` rendered in `numberOfLines` lines
 * inside a cell with `availableHeight` points of vertical space. The result is never below 1:
 * React Native treats `0` as "no limit" and ignores values between 0 and 1.
 */
export function getFixedCellMaxFontSizeMultiplier(
  fontSize: number,
  availableHeight: number,
  numberOfLines = 1,
): number {
  if (
    !Number.isFinite(fontSize) ||
    fontSize <= 0 ||
    !Number.isFinite(availableHeight) ||
    availableHeight <= 0
  ) {
    return FIXED_CELL_MAX_FONT_SIZE_MULTIPLIER;
  }

  const fit = availableHeight / (fontSize * LINE_HEIGHT_RATIO * Math.max(1, numberOfLines));
  const rounded = Math.floor(fit * 100) / 100;
  return Math.min(FIXED_CELL_MAX_FONT_SIZE_MULTIPLIER, Math.max(1, rounded));
}

type FixedCellTextProps = Required<
  Pick<
    TextProps,
    'adjustsFontSizeToFit' | 'maxFontSizeMultiplier' | 'minimumFontScale' | 'numberOfLines'
  >
>;

/** `Text` props that keep default cell text inside a fixed-size cell at any system text size. */
export function getFixedCellTextProps(
  fontSize: number,
  availableHeight: number,
  numberOfLines = 1,
): FixedCellTextProps {
  return {
    adjustsFontSizeToFit: true,
    maxFontSizeMultiplier: getFixedCellMaxFontSizeMultiplier(
      fontSize,
      availableHeight,
      numberOfLines,
    ),
    minimumFontScale: FIXED_CELL_MINIMUM_FONT_SCALE,
    numberOfLines,
  };
}
