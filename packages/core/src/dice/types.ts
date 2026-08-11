import type { GameStatus } from '../lifecycle/index.js';
import type { RandomSource } from '../random/index.js';
import type { GameResult, ResultProvider } from '../result/index.js';

export interface DieDefinition {
  readonly id: string;
  readonly sides: number;
  readonly label?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface DiceSelection {
  readonly values: readonly number[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface DiceResultData {
  readonly values: readonly number[];
  readonly total: number;
}

export interface DiceResult extends GameResult<DiceResultData> {
  readonly dice: readonly DieDefinition[];
  readonly values: readonly number[];
  readonly total: number;
}

export interface CreateDiceOptions {
  readonly dice?: readonly DieDefinition[];
  readonly count?: number;
  readonly sides?: number;
  readonly randomSource?: RandomSource;
  readonly now?: () => number;
}

export interface DiceEngine {
  readonly dice: readonly DieDefinition[];
  readonly status: GameStatus;
  readonly result: DiceResult | undefined;
  roll(): DiceResult;
  rollTo(selection: DiceSelection): DiceResult;
  rollWith<TRequest>(
    provider: ResultProvider<TRequest, DiceSelection>,
    request: TRequest,
  ): Promise<DiceResult>;
  reset(): void;
}
