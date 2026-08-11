import { describe, expect, it } from 'vitest';

import { evaluateBingoPatterns } from './patterns.js';
import { createBingoPatternDefinitions } from './validation.js';

const board = [
  [1, 4, 7],
  [2, 'free', 8],
  [3, 6, 9],
] as const;

describe('Bingo pattern evaluation', () => {
  it('detects rows, columns, and both diagonals', () => {
    const patterns = createBingoPatternDefinitions(3, ['row', 'column', 'diagonal']);
    const check = evaluateBingoPatterns(board, [1, 4, 7, 2, 3, 9], patterns);

    expect(check.completed).toBe(true);
    expect(check.matches.map((match) => match.id)).toEqual([
      'row-1',
      'column-1',
      'diagonal-main',
      'diagonal-anti',
    ]);
  });

  it('supports four corners, full boards, and custom patterns', () => {
    const patterns = createBingoPatternDefinitions(3, [
      'four-corners',
      'full-board',
      {
        id: 'top-left-l',
        label: 'Top-left L',
        cells: [
          { row: 0, column: 0 },
          { row: 1, column: 0 },
          { row: 0, column: 1 },
        ],
      },
    ]);
    const all = [1, 2, 3, 4, 6, 7, 8, 9];

    expect(
      evaluateBingoPatterns(board, [1, 2, 3, 4, 7, 9], patterns).matches.map(({ id }) => id),
    ).toEqual(['four-corners', 'top-left-l']);
    expect(evaluateBingoPatterns(board, all, patterns).matches.map(({ id }) => id)).toEqual([
      'four-corners',
      'full-board',
      'top-left-l',
    ]);
  });

  it('returns an immutable incomplete result', () => {
    const check = evaluateBingoPatterns(board, [], createBingoPatternDefinitions(3, ['row']));

    expect(check).toEqual({ completed: false, matches: [] });
    expect(Object.isFrozen(check)).toBe(true);
    expect(Object.isFrozen(check.matches)).toBe(true);
  });
});
