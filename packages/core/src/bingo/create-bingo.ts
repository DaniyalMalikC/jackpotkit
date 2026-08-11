import { GameStateError } from '../errors/index.js';
import { MathRandomSource, nextRandomValue } from '../random/index.js';
import { createBingoBoard } from './generation.js';
import { evaluateBingoPatterns } from './patterns.js';
import type {
  BingoBoard,
  BingoCheckResult,
  BingoEngine,
  BingoPatternMatch,
  BingoResult,
  BingoState,
  CreateBingoOptions,
} from './types.js';
import {
  assertValidBingoBoard,
  assertValidBingoConfiguration,
  assertValidBingoNumber,
  createBingoPatternDefinitions,
  DEFAULT_BINGO_MAX_NUMBER,
  DEFAULT_BINGO_MIN_NUMBER,
  DEFAULT_BINGO_PATTERNS,
  DEFAULT_BINGO_SIZE,
} from './validation.js';

function copyBoard(board: BingoBoard): BingoBoard {
  return Object.freeze(board.map((row) => Object.freeze([...row])));
}

function numbersInBoardOrder(board: BingoBoard, values: ReadonlySet<number>): readonly number[] {
  return Object.freeze(
    board
      .flatMap((row) => row.filter((value): value is number => typeof value === 'number'))
      .filter((number) => values.has(number)),
  );
}

export function createBingo({
  size = DEFAULT_BINGO_SIZE,
  minNumber = DEFAULT_BINGO_MIN_NUMBER,
  maxNumber = DEFAULT_BINGO_MAX_NUMBER,
  freeSpace = true,
  board: suppliedBoard,
  patterns: suppliedPatterns = DEFAULT_BINGO_PATTERNS,
  randomSource = new MathRandomSource(),
  now = Date.now,
}: CreateBingoOptions = {}): BingoEngine {
  assertValidBingoConfiguration(size, minNumber, maxNumber, freeSpace);
  const board = copyBoard(
    suppliedBoard ?? createBingoBoard({ size, minNumber, maxNumber, freeSpace, randomSource }),
  );
  assertValidBingoBoard(board, size, minNumber, maxNumber, freeSpace);
  const patterns = createBingoPatternDefinitions(size, suppliedPatterns);
  const boardNumbers = new Set(
    board.flatMap((row) => row.filter((value): value is number => typeof value === 'number')),
  );
  let calledNumbers: readonly number[] = Object.freeze([]);
  let called = new Set<number>();
  let marked = new Set<number>();
  let status: BingoEngine['status'] = 'ready';
  let result: BingoResult | undefined;
  let state: BingoState;
  let completionCount = 0;

  function snapshot(
    check: BingoCheckResult = evaluateBingoPatterns(board, marked, patterns),
  ): BingoState {
    return Object.freeze({
      status,
      calledNumbers,
      markedNumbers: numbersInBoardOrder(board, marked),
      completed: check.completed,
      matches: check.matches,
    });
  }

  function refresh(): BingoState {
    const check = evaluateBingoPatterns(board, marked, patterns);
    if (check.completed) {
      if (status !== 'completed') completionCount += 1;
      status = 'completed';
      const markedNumbers = numbersInBoardOrder(board, marked);
      const matchedPatternIds = Object.freeze(check.matches.map((match) => match.id));
      result = Object.freeze({
        id: `bingo-${completionCount}`,
        game: 'bingo',
        data: Object.freeze({ calledNumbers, markedNumbers, matchedPatternIds }),
        timestamp: now(),
        board,
        matches: check.matches as readonly BingoPatternMatch[],
      });
    } else {
      if (calledNumbers.length > 0 || marked.size > 0) status = 'playing';
      result = undefined;
    }
    state = snapshot(check);
    return state;
  }

  function callNumber(number: number): BingoState {
    assertValidBingoNumber(number, minNumber, maxNumber);
    if (called.has(number)) return state;
    called = new Set(called).add(number);
    calledNumbers = Object.freeze([...calledNumbers, number]);
    if (status === 'ready') status = 'playing';
    if (status === 'completed') return refresh();
    state = snapshot();
    return state;
  }

  state = snapshot();

  return {
    board,
    size,
    numberRange: Object.freeze({ min: minNumber, max: maxNumber }),
    patterns,
    get state() {
      return state;
    },
    get status() {
      return status;
    },
    get result() {
      return result;
    },
    call: callNumber,
    draw() {
      const remaining = Array.from(
        { length: maxNumber - minNumber + 1 },
        (_, index) => minNumber + index,
      ).filter((number) => !called.has(number));
      if (remaining.length === 0) throw new GameStateError('All Bingo numbers have been called.');
      const number = remaining[
        Math.floor(nextRandomValue(randomSource) * remaining.length)
      ] as number;
      callNumber(number);
      return number;
    },
    mark(number) {
      assertValidBingoNumber(number, minNumber, maxNumber);
      if (!boardNumbers.has(number)) {
        throw new GameStateError(`Bingo number ${number} is not present on this board.`);
      }
      if (!called.has(number)) {
        throw new GameStateError(`Bingo number ${number} must be called before it can be marked.`);
      }
      if (marked.has(number)) return state;
      marked = new Set(marked).add(number);
      return refresh();
    },
    unmark(number) {
      assertValidBingoNumber(number, minNumber, maxNumber);
      if (!marked.has(number)) return state;
      marked = new Set(marked);
      marked.delete(number);
      return refresh();
    },
    check() {
      return evaluateBingoPatterns(board, marked, patterns);
    },
    reset() {
      calledNumbers = Object.freeze([]);
      called = new Set<number>();
      marked = new Set<number>();
      status = 'ready';
      result = undefined;
      state = snapshot();
      return state;
    },
  };
}
