import { describe, expect, it } from 'vitest';

import { SeededRandomSource } from '../random/index.js';
import { createBingoBoard } from './generation.js';

describe('Bingo board generation', () => {
  it('creates immutable classic cards with column ranges and a center free space', () => {
    const board = createBingoBoard({ randomSource: new SeededRandomSource('classic-card') });
    const numbers = board.flat().filter((value): value is number => typeof value === 'number');

    expect(board).toHaveLength(5);
    expect(board[2]?.[2]).toBe('free');
    expect(new Set(numbers)).toHaveLength(24);
    expect(board.every((row) => typeof row[0] === 'number' && row[0] >= 1 && row[0] <= 15)).toBe(
      true,
    );
    expect(board.every((row) => typeof row[4] === 'number' && row[4] >= 61 && row[4] <= 75)).toBe(
      true,
    );
    expect(Object.isFrozen(board)).toBe(true);
    expect(Object.isFrozen(board[0])).toBe(true);
  });

  it('repeats exactly for the same seed', () => {
    const first = createBingoBoard({ randomSource: new SeededRandomSource(42) });
    const second = createBingoBoard({ randomSource: new SeededRandomSource(42) });
    const different = createBingoBoard({ randomSource: new SeededRandomSource(43) });

    expect(first).toEqual(second);
    expect(first).not.toEqual(different);
  });

  it('supports configurable boards without a free space', () => {
    const board = createBingoBoard({
      freeSpace: false,
      maxNumber: 16,
      randomSource: new SeededRandomSource('small'),
      size: 4,
    });

    expect(board).toHaveLength(4);
    expect(board.flat()).not.toContain('free');
    expect(new Set(board.flat())).toHaveLength(16);
  });
});
