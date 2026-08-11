import type { GameStatus } from '../lifecycle/index.js';
import type { RandomSource } from '../random/index.js';
import type { GameResult } from '../result/index.js';

export type BingoCellValue = number | 'free';
export type BingoBoard = readonly (readonly BingoCellValue[])[];

export interface BingoCoordinate {
  readonly row: number;
  readonly column: number;
}

export type BingoBuiltInPattern = 'row' | 'column' | 'diagonal' | 'four-corners' | 'full-board';

export interface BingoCustomPattern {
  readonly id: string;
  readonly label?: string;
  readonly cells: readonly BingoCoordinate[];
}

export type BingoPattern = BingoBuiltInPattern | BingoCustomPattern;

export interface BingoPatternDefinition {
  readonly id: string;
  readonly kind: BingoBuiltInPattern | 'custom';
  readonly label: string;
  readonly cells: readonly BingoCoordinate[];
}

export type BingoPatternMatch = BingoPatternDefinition;

export interface BingoCheckResult {
  readonly completed: boolean;
  readonly matches: readonly BingoPatternMatch[];
}

export interface BingoState extends BingoCheckResult {
  readonly status: GameStatus;
  readonly calledNumbers: readonly number[];
  readonly markedNumbers: readonly number[];
}

export interface BingoResultData {
  readonly calledNumbers: readonly number[];
  readonly markedNumbers: readonly number[];
  readonly matchedPatternIds: readonly string[];
}

export interface BingoResult extends GameResult<BingoResultData> {
  readonly board: BingoBoard;
  readonly matches: readonly BingoPatternMatch[];
}

export interface BingoNumberRange {
  readonly min: number;
  readonly max: number;
}

export interface CreateBingoBoardOptions {
  readonly size?: number;
  readonly minNumber?: number;
  readonly maxNumber?: number;
  readonly freeSpace?: boolean;
  readonly randomSource?: RandomSource;
}

export interface CreateBingoOptions extends CreateBingoBoardOptions {
  readonly board?: BingoBoard;
  readonly patterns?: readonly BingoPattern[];
  readonly now?: () => number;
}

export interface BingoEngine {
  readonly board: BingoBoard;
  readonly size: number;
  readonly numberRange: BingoNumberRange;
  readonly patterns: readonly BingoPatternDefinition[];
  readonly state: BingoState;
  readonly status: GameStatus;
  readonly result: BingoResult | undefined;
  call(number: number): BingoState;
  draw(): number;
  mark(number: number): BingoState;
  unmark(number: number): BingoState;
  check(): BingoCheckResult;
  reset(): BingoState;
}
