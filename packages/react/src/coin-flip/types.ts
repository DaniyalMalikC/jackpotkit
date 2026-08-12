import type {
  CoinFace,
  CoinFlipResult,
  CoinFlipSelection,
  GameEvent,
  GameEventType,
  GameStatus,
  RandomSource,
  ResultProvider,
} from '@jackpotkit/core';
import type { JackpotTheme, JackpotThemeOverride } from '@jackpotkit/theme';
import type { ReactNode } from 'react';
import type { WebEasing, WebPresentationProps } from '../internal/types.js';
export interface CoinFlipEventPayload<TValue = unknown> {
  readonly result?: CoinFlipResult<TValue>;
  readonly error?: unknown;
}
export type CoinFlipEvent<TValue = unknown> = GameEvent<
  GameEventType,
  CoinFlipEventPayload<TValue>
>;
export interface CoinFlipCallbacks<TValue = unknown> {
  readonly onReady?: () => void;
  readonly onPlayStart?: () => void;
  readonly onResultRequest?: () => void;
  readonly onResultResolved?: (result: CoinFlipResult<TValue>) => void;
  readonly onAnimationStart?: (result: CoinFlipResult<TValue>) => void;
  readonly onRevealStart?: (result: CoinFlipResult<TValue>) => void;
  readonly onComplete?: (result: CoinFlipResult<TValue>) => void;
  readonly onReset?: () => void;
  readonly onError?: (error: unknown) => void;
  readonly onEvent?: (event: CoinFlipEvent<TValue>) => void;
  readonly onStatusChange?: (status: GameStatus) => void;
}
export interface UseCoinFlipOptions<
  TValue = unknown,
  TRequest = void,
> extends CoinFlipCallbacks<TValue> {
  readonly faces?: readonly CoinFace<TValue>[];
  readonly randomSource?: RandomSource;
  readonly result?: CoinFlipSelection;
  readonly resultProvider?: ResultProvider<TRequest, CoinFlipSelection>;
  readonly resultRequest?: TRequest;
  readonly disabled?: boolean;
}
export interface UseCoinFlipReturn<TValue = unknown> {
  readonly status: GameStatus;
  readonly result: CoinFlipResult<TValue> | undefined;
  readonly error: unknown;
  flip(): Promise<CoinFlipResult<TValue>>;
  flipTo(selection: CoinFlipSelection): Promise<CoinFlipResult<TValue>>;
  reset(): void;
}
export interface CoinFaceRenderInfo<TValue = unknown> {
  readonly face: CoinFace<TValue>;
  readonly active: boolean;
  readonly flipping: boolean;
  readonly theme: JackpotTheme;
}
export interface CoinFlipProps<TValue = unknown, TRequest = void>
  extends UseCoinFlipOptions<TValue, TRequest>, WebPresentationProps {
  readonly accessibilityLabel?: string;
  readonly duration?: number;
  readonly easing?: WebEasing;
  readonly reduceMotion?: boolean;
  readonly renderFace?: (info: CoinFaceRenderInfo<TValue>) => ReactNode;
  readonly size?: number;
  readonly theme?: JackpotThemeOverride;
}
export interface CoinFlipRef<TValue = unknown> {
  flip(): Promise<CoinFlipResult<TValue>>;
  flipTo(selection: CoinFlipSelection): Promise<CoinFlipResult<TValue>>;
  reset(): void;
}
