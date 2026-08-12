import axe from 'axe-core';
import { render } from '@testing-library/react';
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
  afterEach(() => vi.restoreAllMocks());

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
