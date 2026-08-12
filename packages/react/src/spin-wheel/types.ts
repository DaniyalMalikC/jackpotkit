import type {
  GameEvent,
  GameEventType,
  GameStatus,
  RandomSource,
  ResultProvider,
  SpinWheelDirection,
  SpinWheelResult,
  SpinWheelSelection,
  WheelSegment,
} from '@jackpotkit/core';
import type { JackpotTheme, JackpotThemeOverride } from '@jackpotkit/theme';
import type { ReactNode } from 'react';

import type { WebEasing, WebPresentationProps } from '../internal/types.js';

export interface SpinWheelEventPayload<TValue = unknown> {
  readonly result?: SpinWheelResult<TValue>;
  readonly error?: unknown;
}
export type SpinWheelEvent<TValue = unknown> = GameEvent<
  GameEventType,
  SpinWheelEventPayload<TValue>
>;
export interface SpinWheelCallbacks<TValue = unknown> {
  readonly onReady?: () => void;
  readonly onPlayStart?: () => void;
  readonly onResultRequest?: () => void;
  readonly onResultResolved?: (result: SpinWheelResult<TValue>) => void;
  readonly onAnimationStart?: (result: SpinWheelResult<TValue>) => void;
  readonly onRevealStart?: (result: SpinWheelResult<TValue>) => void;
  readonly onComplete?: (result: SpinWheelResult<TValue>) => void;
  readonly onReset?: () => void;
  readonly onError?: (error: unknown) => void;
  readonly onEvent?: (event: SpinWheelEvent<TValue>) => void;
  readonly onStatusChange?: (status: GameStatus) => void;
}
export interface UseSpinWheelOptions<
  TValue = unknown,
  TRequest = void,
> extends SpinWheelCallbacks<TValue> {
  readonly segments: readonly WheelSegment<TValue>[];
  readonly randomSource?: RandomSource;
  readonly result?: SpinWheelSelection;
  readonly resultProvider?: ResultProvider<TRequest, SpinWheelSelection>;
  readonly resultRequest?: TRequest;
  readonly disabled?: boolean;
}
export interface UseSpinWheelReturn<TValue = unknown> {
  readonly status: GameStatus;
  readonly result: SpinWheelResult<TValue> | undefined;
  readonly error: unknown;
  spin(): Promise<SpinWheelResult<TValue>>;
  spinTo(segmentId: string): Promise<SpinWheelResult<TValue>>;
  reset(): void;
}
export interface SpinWheelSegmentRenderInfo<TValue = unknown> {
  readonly index: number;
  readonly selected: boolean;
  readonly segment: WheelSegment<TValue>;
  readonly theme: JackpotTheme;
}
export interface SpinWheelProps<TValue = unknown, TRequest = void>
  extends UseSpinWheelOptions<TValue, TRequest>, WebPresentationProps {
  readonly accessibilityLabel?: string;
  readonly direction?: SpinWheelDirection;
  readonly duration?: number;
  readonly easing?: WebEasing;
  readonly reduceMotion?: boolean;
  readonly renderPointer?: (theme: JackpotTheme) => ReactNode;
  readonly renderSegment?: (info: SpinWheelSegmentRenderInfo<TValue>) => ReactNode;
  readonly rotations?: number;
  readonly size?: number;
  readonly theme?: JackpotThemeOverride;
}
export interface SpinWheelRef<TValue = unknown> {
  spin(): Promise<SpinWheelResult<TValue>>;
  spinTo(segmentId: string): Promise<SpinWheelResult<TValue>>;
  reset(): void;
}
