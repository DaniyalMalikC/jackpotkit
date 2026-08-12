import type {
  BingoBoard,
  BingoCheckResult,
  BingoPattern,
  BingoPatternDefinition,
  BingoResult,
  BingoState,
  GameEvent,
  GameEventType,
  GameStatus,
  RandomSource,
} from '@jackpotkit/core';
import type { JackpotTheme, JackpotThemeOverride } from '@jackpotkit/theme';
import type { ReactNode } from 'react';
import type { WebPresentationProps } from '../internal/types.js';
export interface BingoEventPayload {
  readonly number?: number;
  readonly state?: BingoState;
  readonly result?: BingoResult;
  readonly error?: unknown;
}
export type BingoEvent = GameEvent<GameEventType, BingoEventPayload>;
export interface BingoCallbacks {
  readonly onReady?: () => void;
  readonly onCall?: (number: number, state: BingoState) => void;
  readonly onMark?: (number: number, state: BingoState) => void;
  readonly onUnmark?: (number: number, state: BingoState) => void;
  readonly onComplete?: (result: BingoResult) => void;
  readonly onReset?: () => void;
  readonly onError?: (error: unknown) => void;
  readonly onEvent?: (event: BingoEvent) => void;
  readonly onStatusChange?: (status: GameStatus) => void;
}
export interface UseBingoOptions extends BingoCallbacks {
  readonly board?: BingoBoard;
  readonly size?: number;
  readonly minNumber?: number;
  readonly maxNumber?: number;
  readonly freeSpace?: boolean;
  readonly patterns?: readonly BingoPattern[];
  readonly randomSource?: RandomSource;
  readonly now?: () => number;
  readonly disabled?: boolean;
}
export interface UseBingoReturn {
  readonly board: BingoBoard;
  readonly patterns: readonly BingoPatternDefinition[];
  readonly state: BingoState;
  readonly status: GameStatus;
  readonly result: BingoResult | undefined;
  readonly error: unknown;
  call(number: number): BingoState;
  draw(): number;
  mark(number: number): BingoState;
  unmark(number: number): BingoState;
  toggleMark(number: number): BingoState;
  check(): BingoCheckResult;
  reset(): BingoState;
}
export interface BingoCellRenderInfo {
  readonly value: number | 'free';
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly called: boolean;
  readonly marked: boolean;
  readonly matched: boolean;
  readonly disabled: boolean;
  readonly theme: JackpotTheme;
}
export interface BingoProps extends UseBingoOptions, WebPresentationProps {
  readonly accessibilityLabel?: string;
  readonly cellGap?: number;
  readonly reduceMotion?: boolean;
  readonly renderCell?: (info: BingoCellRenderInfo) => ReactNode;
  readonly showCallButton?: boolean;
  readonly theme?: JackpotThemeOverride;
  readonly width?: number;
}
export interface BingoRef {
  call(number: number): BingoState;
  draw(): number;
  mark(number: number): BingoState;
  unmark(number: number): BingoState;
  check(): BingoCheckResult;
  reset(): BingoState;
}
