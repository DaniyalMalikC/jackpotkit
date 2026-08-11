import type { GameStatus } from '../lifecycle/index.js';
import type { GameResult, ResultProvider } from '../result/index.js';

export interface ScratchPoint {
  readonly x: number;
  readonly y: number;
}

export interface ScratchCardSelection<TPrize = unknown> {
  readonly prize?: TPrize;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ScratchCardResultData<TPrize = unknown> {
  readonly prize?: TPrize;
}

export interface ScratchCardResult<TPrize = unknown> extends GameResult<
  ScratchCardResultData<TPrize>
> {
  readonly prize?: TPrize;
}

export interface ScratchCardProgressUpdate {
  readonly progress: number;
  readonly completed: boolean;
}

export interface CreateScratchCardOptions<TPrize = unknown> {
  readonly threshold?: number;
  readonly result?: ScratchCardSelection<TPrize>;
  readonly now?: () => number;
}

export interface ScratchCardEngine<TPrize = unknown> {
  readonly threshold: number;
  readonly status: GameStatus;
  readonly progress: number;
  readonly result: ScratchCardResult<TPrize> | undefined;
  start(selection?: ScratchCardSelection<TPrize>): ScratchCardResult<TPrize>;
  startWith<TRequest>(
    provider: ResultProvider<TRequest, ScratchCardSelection<TPrize>>,
    request: TRequest,
  ): Promise<ScratchCardResult<TPrize>>;
  scratch(progress: number): ScratchCardProgressUpdate;
  reveal(): ScratchCardResult<TPrize>;
  reset(): void;
}

export interface ScratchProgressTrackerOptions {
  readonly width: number;
  readonly height: number;
  readonly brushRadius: number;
  readonly cellSize?: number;
}

export interface ScratchProgressTracker {
  readonly progress: number;
  scratchPoint(point: ScratchPoint): number;
  scratchLine(from: ScratchPoint, to: ScratchPoint): number;
  reset(): void;
}

export interface ScratchCardConfiguration {
  readonly threshold?: number;
  readonly width?: number;
  readonly height?: number;
  readonly brushRadius?: number;
  readonly cellSize?: number;
}
