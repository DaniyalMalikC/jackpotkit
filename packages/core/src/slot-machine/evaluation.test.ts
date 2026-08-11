import { describe, expect, it } from 'vitest';

import { evaluateSlotPaylines } from './evaluation.js';

describe('Slot Machine payline evaluation', () => {
  it('finds matching straight and diagonal paylines', () => {
    const cherry = { id: 'cherry' };
    const star = { id: 'star' };
    const reels = [
      [cherry, star, star],
      [star, cherry, star],
      [star, star, cherry],
    ];

    const winners = evaluateSlotPaylines(reels, [
      [0, 0, 0],
      [1, 0, 1],
      [0, 1, 2],
    ]);

    expect(winners).toHaveLength(2);
    expect(winners.map((winner) => [winner.index, winner.symbolId])).toEqual([
      [1, 'star'],
      [2, 'cherry'],
    ]);
  });
});
