import type { GameStatus } from '../lifecycle/index.js';
import type { RandomSource } from '../random/index.js';
import type { GameResult, ResultProvider } from '../result/index.js';

export interface SlotSymbol<TValue = unknown> {
  readonly id: string;
  readonly label?: string;
  readonly value?: TValue;
  readonly weight?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type SlotPayline = readonly number[];

export interface SlotMachineSelection {
  readonly reels: readonly (readonly string[])[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface SlotWinningPayline<TValue = unknown> {
  readonly index: number;
  readonly rows: SlotPayline;
  readonly symbolId: string;
  readonly symbols: readonly SlotSymbol<TValue>[];
}

export interface SlotEvaluationContext<TValue = unknown> {
  readonly reels: readonly (readonly SlotSymbol<TValue>[])[];
  readonly paylines: readonly SlotPayline[];
  readonly winningPaylines: readonly SlotWinningPayline<TValue>[];
}

export type SlotResultEvaluator<TValue = unknown, TEvaluation = unknown> = (
  context: SlotEvaluationContext<TValue>,
) => TEvaluation;

export interface SlotMachineResultData<TEvaluation = unknown> {
  readonly reels: readonly (readonly string[])[];
  readonly winningPaylineIndexes: readonly number[];
  readonly evaluation?: TEvaluation;
}

export interface SlotMachineResult<TValue = unknown, TEvaluation = unknown> extends GameResult<
  SlotMachineResultData<TEvaluation>
> {
  readonly reels: readonly (readonly SlotSymbol<TValue>[])[];
  readonly winningPaylines: readonly SlotWinningPayline<TValue>[];
  readonly evaluation?: TEvaluation;
}

export interface CreateSlotMachineOptions<TValue = unknown, TEvaluation = unknown> {
  readonly symbols: readonly SlotSymbol<TValue>[];
  readonly reelCount: number;
  readonly rowCount?: number;
  readonly paylines?: readonly SlotPayline[];
  readonly randomSource?: RandomSource;
  readonly evaluate?: SlotResultEvaluator<TValue, TEvaluation>;
  readonly now?: () => number;
}

export interface SlotMachineEngine<TValue = unknown, TEvaluation = unknown> {
  readonly symbols: readonly SlotSymbol<TValue>[];
  readonly reelCount: number;
  readonly rowCount: number;
  readonly paylines: readonly SlotPayline[];
  readonly status: GameStatus;
  readonly result: SlotMachineResult<TValue, TEvaluation> | undefined;
  spin(): SlotMachineResult<TValue, TEvaluation>;
  spinTo(selection: SlotMachineSelection): SlotMachineResult<TValue, TEvaluation>;
  spinWith<TRequest>(
    provider: ResultProvider<TRequest, SlotMachineSelection>,
    request: TRequest,
  ): Promise<SlotMachineResult<TValue, TEvaluation>>;
  reset(): void;
}

export interface SlotMachineConfiguration {
  readonly reelCount: number;
  readonly rowCount: number;
  readonly paylines: readonly SlotPayline[];
}
