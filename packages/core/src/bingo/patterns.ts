import type {
  BingoBoard,
  BingoCheckResult,
  BingoPatternDefinition,
  BingoPatternMatch,
} from './types.js';

export function evaluateBingoPatterns(
  board: BingoBoard,
  markedNumbers: ReadonlySet<number> | readonly number[],
  patterns: readonly BingoPatternDefinition[],
): BingoCheckResult {
  const marked = markedNumbers instanceof Set ? markedNumbers : new Set(markedNumbers);
  const matches = patterns.filter((pattern) =>
    pattern.cells.every(({ row, column }) => {
      const value = board[row]?.[column];
      return value === 'free' || (typeof value === 'number' && marked.has(value));
    }),
  ) as readonly BingoPatternMatch[];

  return Object.freeze({ completed: matches.length > 0, matches: Object.freeze([...matches]) });
}
