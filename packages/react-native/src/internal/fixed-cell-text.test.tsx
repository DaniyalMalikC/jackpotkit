import { render, screen } from '@testing-library/react-native';

import { Bingo } from '../bingo/bingo';
import { CoinFlip } from '../coin-flip/coin-flip';
import { Dice } from '../dice/dice';
import { SlotMachine } from '../slot-machine/slot-machine';
import { SpinWheel } from '../spin-wheel/spin-wheel';
import {
  FIXED_CELL_MAX_FONT_SIZE_MULTIPLIER,
  FIXED_CELL_MINIMUM_FONT_SCALE,
  getFixedCellMaxFontSizeMultiplier,
  getFixedCellTextProps,
} from './fixed-cell-text';

const hidden = { includeHiddenElements: true } as const;

function expectCappedScaling(node: ReturnType<typeof screen.getByText>, numberOfLines = 1) {
  const multiplier: unknown = node.props.maxFontSizeMultiplier;
  expect(typeof multiplier).toBe('number');
  expect(multiplier).toBeGreaterThanOrEqual(1);
  expect(multiplier).toBeLessThanOrEqual(FIXED_CELL_MAX_FONT_SIZE_MULTIPLIER);
  expect(node.props.allowFontScaling).not.toBe(false);
  expect(node.props.adjustsFontSizeToFit).toBe(true);
  expect(node.props.minimumFontScale).toBe(FIXED_CELL_MINIMUM_FONT_SCALE);
  expect(node.props.numberOfLines).toBe(numberOfLines);
}

describe('fixed-cell font scaling', () => {
  it('caps scaling at 200% and at the height that still fits the cell', () => {
    expect(getFixedCellMaxFontSizeMultiplier(20, 1000)).toBe(FIXED_CELL_MAX_FONT_SIZE_MULTIPLIER);
    expect(getFixedCellMaxFontSizeMultiplier(20, 37.5)).toBe(1.5);
    expect(getFixedCellMaxFontSizeMultiplier(20, 25, 2)).toBe(1);
  });

  it('never returns 0 or a sub-1 value, which React Native treats as no limit or ignores', () => {
    expect(getFixedCellMaxFontSizeMultiplier(40, 10)).toBe(1);
    expect(getFixedCellMaxFontSizeMultiplier(0, 72)).toBe(FIXED_CELL_MAX_FONT_SIZE_MULTIPLIER);
    expect(getFixedCellMaxFontSizeMultiplier(28, Number.NaN)).toBe(
      FIXED_CELL_MAX_FONT_SIZE_MULTIPLIER,
    );
    expect(getFixedCellTextProps(14, -4)).toMatchObject({ maxFontSizeMultiplier: 2 });
  });

  // Regression: the 1.0.0 native verification at the largest iOS accessibility text size recorded
  // Slot Machine symbols clipping inside their fixed-size cells.
  it('caps Slot Machine symbol text so it fits the fixed reel cell', async () => {
    await render(
      <SlotMachine
        reelCount={3}
        rowCount={2}
        symbolHeight={72}
        symbols={[
          { id: 'cherry', label: '🍒' },
          { id: 'star', label: '⭐' },
        ]}
      />,
    );

    const symbols = screen.getAllByText('⭐', hidden);
    expect(symbols.length).toBeGreaterThan(0);
    symbols.forEach((symbol) => {
      expectCappedScaling(symbol);
      expect(symbol.props.maxFontSizeMultiplier).toBe(2);
    });
    expect(screen.getByLabelText('Slot Machine')).toBeTruthy();
  });

  it('lowers the cap for large text in short cells', () => {
    // A 30pt Slot Machine cell: fontSize = min(28, 30 * 0.38) = 11.4, 29pt left after the border.
    expect(getFixedCellMaxFontSizeMultiplier(11.4, 29)).toBe(2);
    expect(getFixedCellMaxFontSizeMultiplier(28, 40)).toBe(1.14);
  });

  it('caps Bingo cell numbers and keeps their accessible names', async () => {
    await render(
      <Bingo
        board={[
          [1, 4, 7],
          [2, 'free', 8],
          [3, 6, 9],
        ]}
        maxNumber={9}
        reduceMotion
        size={3}
        width={120}
      />,
    );

    expectCappedScaling(screen.getByText('FREE'));
    expectCappedScaling(screen.getByText('7'));
    // (120 - 2 * 6) / 3 = 36pt cells, minus a 3px matched border on each side, at 15pt text.
    expect(screen.getByText('7').props.maxFontSizeMultiplier).toBe(1.6);
    expect(screen.getByLabelText('Number 7, not called')).toBeTruthy();
  });

  it('caps numeric die faces and keeps the face label', async () => {
    await render(<Dice faceStyle="numbers" reduceMotion sides={20} />);

    expectCappedScaling(screen.getByText('1'));
    expect(screen.getByLabelText('D20: 1')).toBeTruthy();
  });

  it('caps embossed and flat coin face text', async () => {
    const { rerender } = await render(<CoinFlip faceStyle="embossed" reduceMotion size={160} />);

    expectCappedScaling(screen.getByText('H', hidden));
    expectCappedScaling(screen.getByText('Heads', hidden));
    expect(screen.getByText('H', hidden).props.maxFontSizeMultiplier).toBe(1.11);
    expect(screen.getByLabelText('Coin face: Heads')).toBeTruthy();

    await rerender(<CoinFlip faceStyle="flat" reduceMotion size={160} />);
    expectCappedScaling(screen.getByText('Heads', hidden));
  });

  it('caps Spin Wheel segment labels and the fixed-size hub label', async () => {
    await render(
      <SpinWheel
        segments={[
          { color: '#7655D8', id: 'points', label: '100 points' },
          { color: '#E64B87', id: 'badge', label: 'Bonus badge' },
        ]}
        size={240}
      />,
    );

    expectCappedScaling(screen.getByText('100 points'), 2);
    expectCappedScaling(screen.getByText('Spin'));
    expect(screen.getByRole('button', { name: 'Spin' })).toBeTruthy();
  });
});
