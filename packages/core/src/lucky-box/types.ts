import type { GameStatus } from '../lifecycle/index.js';
import type { RandomSource } from '../random/index.js';
import type { GameResult, ResultProvider } from '../result/index.js';

export interface LuckyBoxItem<TReward = unknown> {
  readonly id: string;
  readonly label?: string;
  readonly reward?: TReward;
  readonly disabled?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface LuckyBoxSelection {
  readonly boxId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface LuckyBoxState {
  readonly status: GameStatus;
  readonly selectedBoxId: string | undefined;
  readonly revealed: boolean;
}

export interface LuckyBoxResultData<TReward = unknown> {
  readonly selectedBoxId: string;
  readonly winningBoxId: string;
  readonly won: boolean;
  readonly reward?: TReward;
}

export interface LuckyBoxResult<TReward = unknown> extends GameResult<LuckyBoxResultData<TReward>> {
  readonly selectedBox: LuckyBoxItem<TReward>;
  readonly winningBox: LuckyBoxItem<TReward>;
  readonly won: boolean;
  readonly reward?: TReward;
}

export interface CreateLuckyBoxOptions<TReward = unknown> {
  readonly boxes: readonly LuckyBoxItem<TReward>[];
  readonly randomSource?: RandomSource;
  readonly now?: () => number;
}

export interface LuckyBoxEngine<TReward = unknown> {
  readonly boxes: readonly LuckyBoxItem<TReward>[];
  readonly state: LuckyBoxState;
  readonly status: GameStatus;
  readonly result: LuckyBoxResult<TReward> | undefined;
  select(boxId: string): LuckyBoxState;
  reveal(): LuckyBoxResult<TReward>;
  revealTo(selection: LuckyBoxSelection): LuckyBoxResult<TReward>;
  revealWith<TRequest>(
    provider: ResultProvider<TRequest, LuckyBoxSelection>,
    request: TRequest,
  ): Promise<LuckyBoxResult<TReward>>;
  reset(): LuckyBoxState;
}
