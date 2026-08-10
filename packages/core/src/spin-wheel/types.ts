import type { GameStatus } from '../lifecycle/index.js';
import type { RandomSource } from '../random/index.js';
import type { GameResult, ResultProvider } from '../result/index.js';

export interface WheelSegment<TValue = unknown> {
  readonly id: string;
  readonly label?: string;
  readonly value?: TValue;
  readonly color?: string;
  readonly weight?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface SpinWheelSelection {
  readonly segmentId: string;
}

export interface SpinWheelResultData<TValue = unknown> {
  readonly segmentId: string;
  readonly value?: TValue;
}

export interface SpinWheelResult<TValue = unknown> extends GameResult<SpinWheelResultData<TValue>> {
  readonly segmentId: string;
  readonly segment: WheelSegment<TValue>;
}

export type SpinWheelDirection = 'clockwise' | 'counter-clockwise';

export interface CreateSpinWheelOptions<TValue = unknown> {
  readonly segments: readonly WheelSegment<TValue>[];
  readonly randomSource?: RandomSource;
  readonly now?: () => number;
}

export interface SpinWheelEngine<TValue = unknown> {
  readonly segments: readonly WheelSegment<TValue>[];
  readonly status: GameStatus;
  readonly result: SpinWheelResult<TValue> | undefined;
  spin(): SpinWheelResult<TValue>;
  spinTo(segmentId: string): SpinWheelResult<TValue>;
  spinWith<TRequest>(
    provider: ResultProvider<TRequest, SpinWheelSelection>,
    request: TRequest,
  ): Promise<SpinWheelResult<TValue>>;
  reset(): void;
}

export interface SpinWheelDestinationOptions {
  readonly currentRotation?: number;
  readonly direction?: SpinWheelDirection;
  readonly pointerAngle?: number;
  readonly rotations?: number;
  readonly segmentCount: number;
  readonly segmentIndex: number;
}
