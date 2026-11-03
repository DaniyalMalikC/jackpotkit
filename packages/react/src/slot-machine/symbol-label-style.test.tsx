import { createSlotSymbols } from '@jackpotkit/testing';
import { cleanup, render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { SlotMachine } from './index.js';
import {
  getSymbolLabelStyle,
  measureLabelUnits,
  measureTwoLineUnits,
  SYMBOL_LABEL_CHARACTER_WIDTH,
} from './symbol-label-style.js';

// Regression: 1.1.0 sized default symbol text from the cell height only, so "Symbol 1" labels
// clipped horizontally at 380px with 3 reels. jsdom cannot lay out text, so these tests pin the
// CSS contract that makes the browser fit the label to the cell width.

const cqiTerm = (units: number) =>
  `calc(100cqi / ${Number((units * SYMBOL_LABEL_CHARACTER_WIDTH).toFixed(3))})`;

describe('symbol label sizing', () => {
  it('counts graphemes, treating emoji and CJK as wide', () => {
    expect(measureLabelUnits('Symbol 1')).toBe(8);
    expect(measureLabelUnits('🍒')).toBe(1.6);
    expect(measureLabelUnits('👨‍👩‍👧')).toBe(1.6);
    expect(measureLabelUnits('大吉')).toBe(3.2);
  });

  it('balances multi-word labels over two lines', () => {
    expect(measureTwoLineUnits('Cherry')).toBeUndefined();
    expect(measureTwoLineUnits('Symbol 1')).toBe(6);
    expect(measureTwoLineUnits('Big Lucky Seven')).toBe(9);
  });

  it('caps long labels by the cell width as well as the cell height', () => {
    const style = getSymbolLabelStyle('Symbol 1', 64);
    expect(style.fontSize).toBe(
      `max(8px, max(min(32px, ${cqiTerm(8)}), min(28.64px, ${cqiTerm(6)})))`,
    );
    expect(style.lineHeight).toBe(1.1);
    expect(style.minWidth).toBe(0);
    expect(style.maxWidth).toBe('100%');
  });

  it('keeps short labels on one line at the previous height cap', () => {
    expect(getSymbolLabelStyle('🍒', 64).fontSize).toBe(`max(8px, min(32px, ${cqiTerm(1.6)}))`);
    expect(getSymbolLabelStyle('7', 100).fontSize).toBe(`max(8px, min(34px, ${cqiTerm(1)}))`);
  });

  it('does not offer a second line when two lines cannot fit the cell height', () => {
    expect(getSymbolLabelStyle('Symbol 1', 16).fontSize).toBe(`max(8px, min(8px, ${cqiTerm(8)}))`);
  });
});

describe('SlotMachine default symbol text (web)', () => {
  afterEach(cleanup);

  const cells = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>('[data-jackpotkit-slot-strip] > div'));

  it('renders long default labels in width-fitted spans inside query containers', () => {
    const { container } = render(
      <SlotMachine reelCount={3} rowCount={3} symbols={createSlotSymbols(4)} width={380} />,
    );
    const all = cells(container);
    expect(all.length).toBeGreaterThan(0);
    for (const cell of all) {
      expect(cell.style.containerType).toBe('inline-size');
      // The cell keeps the 1.1.0 size, which engines without `cqi` support fall back to.
      expect(cell.style.fontSize).toBe('32px');
      const label = cell.querySelector<HTMLElement>('[data-jackpotkit-slot-label]');
      expect(label?.textContent).toMatch(/^Symbol \d$/);
    }
  });

  // jsdom's CSSOM drops `cqi` values, so the emitted style is checked in server-rendered markup,
  // which also proves the renderer stays SSR-safe.
  const labelStyles = (markup: string) =>
    new Map(
      Array.from(
        markup.matchAll(/<span data-jackpotkit-slot-label="" style="([^"]*)">([^<]*)<\/span>/gu),
        (match) => [match[2], match[1]] as const,
      ),
    );

  it('emits the width-fitted font size for long labels in server markup', () => {
    const styles = labelStyles(
      renderToStaticMarkup(
        <SlotMachine reelCount={3} rowCount={3} symbols={createSlotSymbols(4)} width={380} />,
      ),
    );
    expect([...styles.keys()].sort()).toEqual(['Symbol 1', 'Symbol 2', 'Symbol 3', 'Symbol 4']);
    expect(styles.get('Symbol 1')).toBe(
      `font-size:max(8px, max(min(32px, ${cqiTerm(8)}), min(28.64px, ${cqiTerm(6)})));line-height:1.1;max-width:100%;min-width:0`,
    );
  });

  it('sizes short labels differently from long labels', () => {
    const styles = labelStyles(
      renderToStaticMarkup(
        <SlotMachine
          reelCount={3}
          rowCount={1}
          symbols={[
            { id: 'cherry', label: '🍒' },
            { id: 'symbol-1', label: 'Symbol 1' },
          ]}
        />,
      ),
    );
    expect(styles.get('🍒')).toContain(cqiTerm(1.6));
    expect(styles.get('🍒')).not.toContain(cqiTerm(8));
    expect(styles.get('Symbol 1')).toContain(cqiTerm(8));
  });

  it('leaves custom renderSymbol output and its cell untouched', () => {
    const { container } = render(
      <SlotMachine
        reelCount={3}
        renderSymbol={({ symbol }) => <b data-custom="">{symbol.id}</b>}
        rowCount={1}
        symbols={createSlotSymbols(4)}
      />,
    );
    for (const cell of cells(container)) {
      expect(cell.style.containerType).toBe('');
      expect(cell.style.fontSize).toBe('32px');
      expect(cell.querySelector('[data-jackpotkit-slot-label]')).toBeNull();
      expect(cell.firstElementChild?.getAttribute('data-custom')).toBe('');
    }
  });
});
