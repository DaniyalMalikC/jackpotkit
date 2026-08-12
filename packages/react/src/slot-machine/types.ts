import type {
  GameEvent,
  GameEventType,
  GameStatus,
  RandomSource,
  ResultProvider,
  SlotMachineResult,
  SlotMachineSelection,
  SlotPayline,
  SlotResultEvaluator,
  SlotSymbol,
} from '@jackpotkit/core';
import type { JackpotTheme, JackpotThemeOverride } from '@jackpotkit/theme';
import type { ReactNode } from 'react';
import type { WebEasing, WebPresentationProps } from '../internal/types.js';
export interface SlotMachineEventPayload<TValue = unknown, TEvaluation = unknown> {
  readonly reelIndex?: number;
  readonly result?: SlotMachineResult<TValue, TEvaluation>;
  readonly error?: unknown;
}
export type SlotMachineEvent<TValue = unknown, TEvaluation = unknown> = GameEvent<
  GameEventType,
  SlotMachineEventPayload<TValue, TEvaluation>
>;
export interface SlotMachineCallbacks<TValue = unknown, TEvaluation = unknown> {
  readonly onReady?: () => void;
  readonly onPlayStart?: () => void;
  readonly onResultRequest?: () => void;
  readonly onResultResolved?: (result: SlotMachineResult<TValue, TEvaluation>) => void;
  readonly onAnimationStart?: (result: SlotMachineResult<TValue, TEvaluation>) => void;
  readonly onReelStop?: (reelIndex: number, result: SlotMachineResult<TValue, TEvaluation>) => void;
  readonly onRevealStart?: (result: SlotMachineResult<TValue, TEvaluation>) => void;
  readonly onComplete?: (result: SlotMachineResult<TValue, TEvaluation>) => void;
  readonly onReset?: () => void;
  readonly onError?: (error: unknown) => void;
  readonly onEvent?: (event: SlotMachineEvent<TValue, TEvaluation>) => void;
  readonly onStatusChange?: (status: GameStatus) => void;
}
export interface UseSlotMachineOptions<
  TValue = unknown,
  TEvaluation = unknown,
  TRequest = void,
> extends SlotMachineCallbacks<TValue, TEvaluation> {
  readonly symbols: readonly SlotSymbol<TValue>[];
  readonly reelCount: number;
  readonly rowCount?: number;
  readonly paylines?: readonly SlotPayline[];
  readonly randomSource?: RandomSource;
  readonly evaluate?: SlotResultEvaluator<TValue, TEvaluation>;
  readonly result?: SlotMachineSelection;
  readonly resultProvider?: ResultProvider<TRequest, SlotMachineSelection>;
  readonly resultRequest?: TRequest;
  readonly disabled?: boolean;
}
export interface UseSlotMachineReturn<TValue = unknown, TEvaluation = unknown> {
  readonly status: GameStatus;
  readonly result: SlotMachineResult<TValue, TEvaluation> | undefined;
  readonly error: unknown;
  spin(): Promise<SlotMachineResult<TValue, TEvaluation>>;
  spinTo(selection: SlotMachineSelection): Promise<SlotMachineResult<TValue, TEvaluation>>;
  reset(): void;
}
export interface SlotSymbolRenderInfo<TValue = unknown> {
  readonly reelIndex: number;
  readonly rowIndex: number;
  readonly symbol: SlotSymbol<TValue>;
  readonly theme: JackpotTheme;
  readonly winning: boolean;
}
export interface SlotMachineProps<TValue = unknown, TEvaluation = unknown, TRequest = void>
  extends UseSlotMachineOptions<TValue, TEvaluation, TRequest>, WebPresentationProps {
  readonly accessibilityLabel?: string;
  readonly duration?: number;
  readonly easing?: WebEasing;
  readonly reduceMotion?: boolean;
  readonly reelDelay?: number;
  readonly renderSymbol?: (info: SlotSymbolRenderInfo<TValue>) => ReactNode;
  readonly symbolHeight?: number;
  readonly theme?: JackpotThemeOverride;
  readonly width?: number;
}
export interface SlotMachineRef<TValue = unknown, TEvaluation = unknown> {
  spin(): Promise<SlotMachineResult<TValue, TEvaluation>>;
  spinTo(selection: SlotMachineSelection): Promise<SlotMachineResult<TValue, TEvaluation>>;
  reset(): void;
}
