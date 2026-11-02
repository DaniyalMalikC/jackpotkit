import type { CSSProperties } from 'react';

/** Largest font size, in pixels, of default symbol text (the pre-fit cap). */
export const SYMBOL_LABEL_MAX_FONT_SIZE = 34;
/** Smallest font size, in pixels, that default symbol text shrinks to. */
export const SYMBOL_LABEL_MIN_FONT_SIZE = 8;
/** Line height of default symbol text. Two lines must fit the cell height. */
export const SYMBOL_LABEL_LINE_HEIGHT = 1.1;
/**
 * Conservative advance width, in em, of one narrow character in heavy (900) Latin text. Inter
 * Black averages about 0.55em; the extra margin covers wider fallback fonts.
 */
export const SYMBOL_LABEL_CHARACTER_WIDTH = 0.66;
/** Width, in narrow characters, of one wide grapheme (CJK, fullwidth forms, emoji). */
const WIDE_GRAPHEME_UNITS = 1.6;

const wideGrapheme = /[\p{Extended_Pictographic}ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u;

const segmenter =
  typeof Intl === 'object' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : undefined;

function graphemes(text: string): string[] {
  if (segmenter === undefined) return Array.from(text);
  return Array.from(segmenter.segment(text), ({ segment }) => segment);
}

/** Estimated width of `text` in narrow-character units. */
export function measureLabelUnits(text: string): number {
  return graphemes(text).reduce(
    (units, grapheme) => units + (wideGrapheme.test(grapheme) ? WIDE_GRAPHEME_UNITS : 1),
    0,
  );
}

/**
 * Width, in narrow-character units, of the longer line when a multi-word label is split at the word
 * boundary that best balances two lines. Returns `undefined` for single-word labels.
 */
export function measureTwoLineUnits(text: string): number | undefined {
  const words = text.trim().split(/\s+/u);
  if (words.length < 2) return undefined;
  let best = Number.POSITIVE_INFINITY;
  for (let split = 1; split < words.length; split += 1) {
    const first = measureLabelUnits(words.slice(0, split).join(' '));
    const second = measureLabelUnits(words.slice(split).join(' '));
    best = Math.min(best, Math.max(first, second));
  }
  return best;
}

function px(value: number): string {
  return `${Number(value.toFixed(2))}px`;
}

function widthFit(units: number): string {
  return `calc(100cqi / ${Number((Math.max(1, units) * SYMBOL_LABEL_CHARACTER_WIDTH).toFixed(3))})`;
}

/**
 * Font size the symbol cell uses for inherited text. Unchanged from 1.1.0, so custom `renderSymbol`
 * output and engines without container query units keep the previous behaviour.
 */
export function getSymbolCellFontSize(symbolHeight: number): number {
  return Math.min(SYMBOL_LABEL_MAX_FONT_SIZE, symbolHeight * 0.5);
}

/**
 * Style for default symbol text (`symbol.label ?? symbol.id`), sized in CSS so it fits the width of
 * its cell at any reel count without measuring in JavaScript.
 *
 * The cell is an inline-size query container, so `100cqi` is the width of its content box. A single
 * line shrinks until every character fits; a multi-word label may instead wrap onto two lines when
 * that gives larger text and two lines fit the cell height. Engines without container query units
 * drop the declaration and inherit the cell font size, which is the 1.1.0 behaviour.
 */
export function getSymbolLabelStyle(label: string, symbolHeight: number): CSSProperties {
  const singleCap = getSymbolCellFontSize(symbolHeight);
  const single = `min(${px(singleCap)}, ${widthFit(measureLabelUnits(label))})`;
  const twoLineUnits = measureTwoLineUnits(label);
  // The cell content box is one pixel shorter than `symbolHeight` because of its bottom border.
  const twoLineCap = Math.min(singleCap, (symbolHeight - 1) / (2 * SYMBOL_LABEL_LINE_HEIGHT));
  const fitted =
    twoLineUnits === undefined || twoLineCap < SYMBOL_LABEL_MIN_FONT_SIZE
      ? single
      : `max(${single}, min(${px(twoLineCap)}, ${widthFit(twoLineUnits)}))`;
  return {
    fontSize: `max(${px(Math.min(SYMBOL_LABEL_MIN_FONT_SIZE, singleCap))}, ${fitted})`,
    lineHeight: SYMBOL_LABEL_LINE_HEIGHT,
    maxWidth: '100%',
    minWidth: 0,
  };
}
