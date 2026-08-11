import { describe, expect, it } from 'vitest';

import {
  assertValidBingoBoard,
  assertValidBingoConfiguration,
  assertValidBingoNumber,
  createBingoPatternDefinitions,
} from './validation.js';

describe('Bingo validation', () => {
  it('rejects impossible dimensions and number ranges', () => {
    expect(() => assertValidBingoConfiguration(1, 1, 75, true)).toThrow('size must be at least 2');
    expect(() => assertValidBingoConfiguration(4, 1, 75, true)).toThrow(
      'free space requires an odd board size',
    );
    expect(() => assertValidBingoConfiguration(5, 1, 20, true)).toThrow('requires 24');
    expect(() => assertValidBingoConfiguration(5, 75, 1, true)).toThrow('minNumber must be less');
  });

  it('rejects malformed and duplicate external board numbers', () => {
    expect(() => assertValidBingoBoard([[1]], 3, 1, 9, true)).toThrow('exactly 3 rows');
    expect(() =>
      assertValidBingoBoard(
        [
          [1, 4, 7],
          [2, 'free', 8],
          [3, 6, 1],
        ],
        3,
        1,
        9,
        true,
      ),
    ).toThrow('duplicate number 1');
    expect(() =>
      assertValidBingoBoard(
        [
          [1, 4, 7],
          [2, 5, 8],
          [3, 6, 9],
        ],
        3,
        1,
        9,
        true,
      ),
    ).toThrow('one free space in its center');
  });

  it('rejects invalid and duplicate custom patterns', () => {
    expect(() => createBingoPatternDefinitions(3, [])).toThrow('at least one');
    expect(() =>
      createBingoPatternDefinitions(3, [{ id: 'outside', cells: [{ row: 3, column: 0 }] }]),
    ).toThrow('out-of-range');
    expect(() =>
      createBingoPatternDefinitions(3, [
        { id: 'same', cells: [{ row: 0, column: 0 }] },
        { id: 'same', cells: [{ row: 1, column: 1 }] },
      ]),
    ).toThrow('Duplicate Bingo pattern ID');
    expect(() => createBingoPatternDefinitions(3, ['unknown' as 'row'])).toThrow(
      'Unknown Bingo pattern',
    );
  });

  it('rejects invalid called numbers', () => {
    expect(() => assertValidBingoNumber(0, 1, 75)).toThrow('from 1 through 75');
    expect(() => assertValidBingoNumber(1.5, 1, 75)).toThrow('safe integer');
  });
});
