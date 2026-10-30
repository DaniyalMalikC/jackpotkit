import axe from 'axe-core';
import { neonTheme } from '@jackpotkit/theme';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Bingo } from './bingo/index.js';
import { CoinFlip } from './coin-flip/index.js';
import { Dice } from './dice/index.js';
import { LuckyBox } from './lucky-box/index.js';
import { ScratchCard } from './scratch-card/index.js';
import { SlotMachine } from './slot-machine/index.js';
import { SpinWheel } from './spin-wheel/index.js';

const BINGO_BOARD = [
  [1, 2, 3],
  [4, 'free', 5],
  [6, 7, 8],
] as const;

describe('React web accessibility audit', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it.each([
    [
      'Spin Wheel',
      <SpinWheel
        segments={[
          { id: 'points', label: '100 points' },
          { id: 'badge', label: 'Badge' },
        ]}
        size={200}
      />,
    ],
    ['Dice', <Dice count={2} width={240} />],
    ['Coin Flip', <CoinFlip size={120} />],
    ['Neon Coin Flip', <CoinFlip size={120} theme={neonTheme} />],
    [
      'Lucky Box',
      <LuckyBox
        boxes={[
          { id: 'one', label: 'One' },
          { id: 'two', label: 'Two' },
        ]}
        width={240}
      />,
    ],
    [
      'Slot Machine',
      <SlotMachine
        reelCount={2}
        rowCount={1}
        symbols={[
          { id: 'cherry', label: 'Cherry' },
          { id: 'star', label: 'Star' },
        ]}
        width={240}
      />,
    ],
    ['Bingo', <Bingo board={BINGO_BOARD} maxNumber={9} patterns={['row']} size={3} width={240} />],
  ])('%s has no detectable WCAG 2 A/AA violations', async (_name, component) => {
    const { container } = render(component);
    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });
    expect(results.violations).toEqual([]);
  });

  // Regression: B4 Playwright + axe in Chromium reported these as serious violations. jsdom cannot
  // compute rendered text, so axe returns them as "incomplete" here; both lists must stay empty.
  it.each([
    ['numbers', <Dice count={2} result={{ values: [3, 5] }} width={240} />],
    ['pips', <Dice count={2} faceStyle="pips" result={{ values: [3, 5] }} width={240} />],
  ])('names %s Dice faces with an image role so aria-label is permitted', async (_style, dice) => {
    render(dice);
    const faces = screen.getAllByRole('img', { name: /^D6: \d$/ });
    expect(faces).toHaveLength(2);
    const results = await axe.run(
      { include: faces },
      { runOnly: { type: 'rule', values: ['aria-prohibited-attr'] } },
    );
    expect([...results.violations, ...results.incomplete]).toEqual([]);
  });

  it('keeps the Slot Machine spin control name aligned with its visible text', async () => {
    render(
      <SlotMachine
        reelCount={2}
        rowCount={1}
        symbols={[
          { id: 'cherry', label: 'Cherry' },
          { id: 'star', label: 'Star' },
        ]}
        width={240}
      />,
    );
    const button = screen.getByRole('button', { name: /PULL TO SPIN/ });
    expect(button.hasAttribute('aria-label')).toBe(false);
    const results = await axe.run(button, {
      runOnly: { type: 'rule', values: ['label-content-name-mismatch'] },
    });
    expect([...results.violations, ...results.incomplete]).toEqual([]);
  });

  it('provides an accessible Scratch Card gesture alternative', async () => {
    const { container } = render(
      <ScratchCard height={120} result={{ prize: 'Bonus' }} width={240}>
        Bonus
      </ScratchCard>,
    );
    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });
    expect(results.violations).toEqual([]);
  });
});
