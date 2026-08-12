import type {
  GameEvent,
  GameEventType,
  GameStatus,
  LuckyBoxItem,
  LuckyBoxResult,
  LuckyBoxSelection,
  RandomSource,
  ResultProvider,
} from '@jackpotkit/core';
import type { JackpotTheme, JackpotThemeOverride } from '@jackpotkit/theme';
import type { ReactNode } from 'react';
import type { WebEasing, WebPresentationProps } from '../internal/types.js';
export interface LuckyBoxEventPayload<TReward = unknown> {
  readonly result?: LuckyBoxResult<TReward>;
  readonly error?: unknown;
}
export type LuckyBoxEvent<TReward = unknown> = GameEvent<
  GameEventType,
  LuckyBoxEventPayload<TReward>
>;
export interface LuckyBoxCallbacks<TReward = unknown> {
  readonly onReady?: () => void;
  readonly onSelect?: (box: LuckyBoxItem<TReward>) => void;
  readonly onPlayStart?: () => void;
  readonly onResultRequest?: () => void;
  readonly onResultResolved?: (result: LuckyBoxResult<TReward>) => void;
  readonly onAnimationStart?: (result: LuckyBoxResult<TReward>) => void;
  readonly onRevealStart?: (result: LuckyBoxResult<TReward>) => void;
  readonly onComplete?: (result: LuckyBoxResult<TReward>) => void;
  readonly onReset?: () => void;
  readonly onError?: (error: unknown) => void;
  readonly onEvent?: (event: LuckyBoxEvent<TReward>) => void;
  readonly onStatusChange?: (status: GameStatus) => void;
}
export interface UseLuckyBoxOptions<
  TReward = unknown,
  TRequest = void,
> extends LuckyBoxCallbacks<TReward> {
  readonly boxes: readonly LuckyBoxItem<TReward>[];
  readonly randomSource?: RandomSource;
  readonly result?: LuckyBoxSelection;
  readonly resultProvider?: ResultProvider<TRequest, LuckyBoxSelection>;
  readonly resultRequest?: TRequest;
  readonly disabled?: boolean;
}
export interface UseLuckyBoxReturn<TReward = unknown> {
  readonly status: GameStatus;
  readonly selectedBoxId: string | undefined;
  readonly result: LuckyBoxResult<TReward> | undefined;
  readonly error: unknown;
  select(boxId: string): void;
  reveal(): Promise<LuckyBoxResult<TReward>>;
  revealTo(selection: LuckyBoxSelection): Promise<LuckyBoxResult<TReward>>;
  pick(boxId: string): Promise<LuckyBoxResult<TReward>>;
  reset(): void;
}
export interface LuckyBoxRenderInfo<TReward = unknown> {
  readonly box: LuckyBoxItem<TReward>;
  readonly selected: boolean;
  readonly winning: boolean;
  readonly revealed: boolean;
  readonly theme: JackpotTheme;
}
export interface LuckyBoxProps<TReward = unknown, TRequest = void>
  extends UseLuckyBoxOptions<TReward, TRequest>, WebPresentationProps {
  readonly accessibilityLabel?: string;
  readonly columns?: number;
  readonly duration?: number;
  readonly easing?: WebEasing;
  readonly reduceMotion?: boolean;
  readonly renderBox?: (info: LuckyBoxRenderInfo<TReward>) => ReactNode;
  readonly theme?: JackpotThemeOverride;
  readonly width?: number;
}
export interface LuckyBoxRef<TReward = unknown> {
  pick(boxId: string): Promise<LuckyBoxResult<TReward>>;
  reveal(): Promise<LuckyBoxResult<TReward>>;
  revealTo(selection: LuckyBoxSelection): Promise<LuckyBoxResult<TReward>>;
  reset(): void;
  select(boxId: string): void;
}
