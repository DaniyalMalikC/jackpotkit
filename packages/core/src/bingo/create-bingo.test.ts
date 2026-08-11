import { describe, expect, it, vi } from 'vitest';

import { GameStateError, SeededRandomSource } from '../index.js';
import { createBingo } from './create-bingo.js';

const board = [
  [1, 4, 7],
  [2, 'free', 8],
  [3, 6, 9],
] as const;

describe('Bingo engine', () => {
  it('calls, marks, checks, unmarks, and resets through immutable states', () => {
    const bingo = createBingo({ board, maxNumber: 9, size: 3, now: () => 123 });
    const initial = bingo.state;

    for (const number of [1, 4, 7]) {
      bingo.call(number);
      bingo.mark(number);
    }

    expect(initial).toEqual({
      calledNumbers: [],
      completed: false,
      markedNumbers: [],
      matches: [],
      status: 'ready',
    });
    expect(bingo.status).toBe('completed');
    expect(bingo.check().matches.map(({ id }) => id)).toContain('row-1');
    expect(bingo.result).toMatchObject({
      data: { matchedPatternIds: expect.arrayContaining(['row-1']) },
      game: 'bingo',
      id: 'bingo-1',
      timestamp: 123,
    });
    expect(Object.isFrozen(bingo.state)).toBe(true);
    expect(bingo.unmark(4).status).toBe('playing');
    expect(bingo.result).toBeUndefined();
    expect(bingo.reset()).toMatchObject({ calledNumbers: [], markedNumbers: [], status: 'ready' });
  });

  it('prevents duplicate calls and marks without mutating state', () => {
    const bingo = createBingo({ board, maxNumber: 9, size: 3 });
    const called = bingo.call(1);
    expect(bingo.call(1)).toBe(called);
    const marked = bingo.mark(1);
    expect(bingo.mark(1)).toBe(marked);
    expect(bingo.state.calledNumbers).toEqual([1]);
    expect(bingo.state.markedNumbers).toEqual([1]);
  });

  it('requires numbers to be called and present before marking', () => {
    const bingo = createBingo({ board, maxNumber: 12, size: 3 });
    expect(() => bingo.mark(1)).toThrow('must be called');
    bingo.call(10);
    expect(() => bingo.mark(10)).toThrow('not present');
    expect(() => bingo.mark(10)).toThrow(GameStateError);
  });

  it('draws every number once using seeded randomness', () => {
    const first = createBingo({
      board,
      maxNumber: 9,
      randomSource: new SeededRandomSource('draw'),
      size: 3,
    });
    const second = createBingo({
      board,
      maxNumber: 9,
      randomSource: new SeededRandomSource('draw'),
      size: 3,
    });
    const firstCalls = Array.from({ length: 9 }, () => first.draw());
    const secondCalls = Array.from({ length: 9 }, () => second.draw());

    expect(firstCalls).toEqual(secondCalls);
    expect(new Set(firstCalls)).toHaveLength(9);
    expect(() => first.draw()).toThrow('All Bingo numbers have been called');
  });

  it('accepts custom completion patterns', () => {
    const now = vi.fn(() => 10);
    const bingo = createBingo({
      board,
      maxNumber: 9,
      now,
      patterns: [
        {
          id: 'corners',
          cells: [
            { row: 0, column: 0 },
            { row: 2, column: 2 },
          ],
        },
      ],
      size: 3,
    });
    for (const number of [1, 9]) {
      bingo.call(number);
      bingo.mark(number);
    }

    expect(bingo.result?.matches[0]?.id).toBe('corners');
    expect(now).toHaveBeenCalled();
  });
});
