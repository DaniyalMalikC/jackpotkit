import { describe, expect, it } from 'vitest';

import type { RandomSource } from '../random/index.js';
import { createRandomSlotSelection, selectSlotSymbol } from './selection.js';

function sequence(values: readonly number[]): RandomSource {
  let index = 0;
  return { next: () => values[index++] ?? 0 };
}

describe('Slot Machine selection', () => {
  const symbols = [
    { id: 'common', weight: 9 },
    { id: 'rare', weight: 1 },
  ];

  it('uses symbol weights', () => {
    expect(selectSlotSymbol(symbols, sequence([0.899_999])).id).toBe('common');
    expect(selectSlotSymbol(symbols, sequence([0.9])).id).toBe('rare');
  });

  it('creates deterministic reel-major grids', () => {
    expect(createRandomSlotSelection(symbols, 2, 2, sequence([0, 0.99, 0.99, 0]))).toEqual({
      reels: [
        ['common', 'rare'],
        ['rare', 'common'],
      ],
    });
  });
});
