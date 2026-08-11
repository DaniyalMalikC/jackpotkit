import type { GameStatus } from '../lifecycle/index.js';
import type { RandomSource } from '../random/index.js';
import type { GameResult, ResultProvider } from '../result/index.js';

export interface CoinFace<TValue = unknown> {
  readonly id: string;
  readonly label?: string;
  readonly value?: TValue;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CoinFlipSelection {
  readonly faceId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CoinFlipResultData<TValue = unknown> {
  readonly faceId: string;
  readonly value?: TValue;
}

export interface CoinFlipResult<TValue = unknown> extends GameResult<CoinFlipResultData<TValue>> {
  readonly faceId: string;
  readonly face: CoinFace<TValue>;
}

export interface CreateCoinFlipOptions<TValue = unknown> {
  readonly faces?: readonly CoinFace<TValue>[];
  readonly randomSource?: RandomSource;
  readonly now?: () => number;
}

export interface CoinFlipEngine<TValue = unknown> {
  readonly faces: readonly CoinFace<TValue>[];
  readonly status: GameStatus;
  readonly result: CoinFlipResult<TValue> | undefined;
  flip(): CoinFlipResult<TValue>;
  flipTo(selection: CoinFlipSelection): CoinFlipResult<TValue>;
  flipWith<TRequest>(
    provider: ResultProvider<TRequest, CoinFlipSelection>,
    request: TRequest,
  ): Promise<CoinFlipResult<TValue>>;
  reset(): void;
}
