import type {
  GameEvent,
  GameEventType,
  GameStatus,
  ResultProvider,
  ScratchCardProgressUpdate,
  ScratchCardResult,
  ScratchCardSelection,
} from '@jackpotkit/core';
import type { JackpotTheme, JackpotThemeOverride } from '@jackpotkit/theme';
import type { ReactNode } from 'react';
import type { WebPresentationProps } from '../internal/types.js';
export interface ScratchCardEventPayload<TPrize = unknown> {
  readonly progress?: number;
  readonly result?: ScratchCardResult<TPrize>;
  readonly error?: unknown;
}
export type ScratchCardEvent<TPrize = unknown> = GameEvent<
  GameEventType,
  ScratchCardEventPayload<TPrize>
>;
export interface ScratchCardCallbacks<TPrize = unknown> {
  readonly onReady?: () => void;
  readonly onPlayStart?: () => void;
  readonly onResultRequest?: () => void;
  readonly onResultResolved?: (result: ScratchCardResult<TPrize>) => void;
  readonly onProgress?: (progress: number) => void;
  readonly onRevealStart?: (result: ScratchCardResult<TPrize>) => void;
  readonly onComplete?: (result: ScratchCardResult<TPrize>) => void;
  readonly onReset?: () => void;
  readonly onError?: (error: unknown) => void;
  readonly onEvent?: (event: ScratchCardEvent<TPrize>) => void;
  readonly onStatusChange?: (status: GameStatus) => void;
}
export interface UseScratchCardOptions<
  TPrize = unknown,
  TRequest = void,
> extends ScratchCardCallbacks<TPrize> {
  readonly threshold?: number;
  readonly result?: ScratchCardSelection<TPrize>;
  readonly resultProvider?: ResultProvider<TRequest, ScratchCardSelection<TPrize>>;
  readonly resultRequest?: TRequest;
  readonly disabled?: boolean;
}
export interface UseScratchCardReturn<TPrize = unknown> {
  readonly status: GameStatus;
  readonly progress: number;
  readonly result: ScratchCardResult<TPrize> | undefined;
  readonly error: unknown;
  begin(): Promise<ScratchCardResult<TPrize>>;
  scratch(progress: number): ScratchCardProgressUpdate;
  reveal(): Promise<ScratchCardResult<TPrize>>;
  reset(): void;
}
export interface ScratchCardSolidCover {
  readonly type: 'solid';
  readonly color?: string;
}
export interface ScratchCardImageCover {
  readonly type: 'image';
  readonly source: string;
  readonly fallbackColor?: string;
  readonly crossOrigin?: 'anonymous' | 'use-credentials';
}
export type ScratchCardCover = ScratchCardSolidCover | ScratchCardImageCover;
export interface ScratchCardCoverRenderInfo {
  readonly height: number;
  readonly theme: JackpotTheme;
  readonly width: number;
}
export interface ScratchCardProps<TPrize = unknown, TRequest = void>
  extends UseScratchCardOptions<TPrize, TRequest>, WebPresentationProps {
  readonly accessibilityLabel?: string;
  readonly autoReveal?: boolean;
  readonly borderRadius?: number;
  readonly brushRadius?: number;
  readonly children: ReactNode | ((result: ScratchCardResult<TPrize> | undefined) => ReactNode);
  readonly cover?: ScratchCardCover;
  readonly height: number;
  readonly reduceMotion?: boolean;
  readonly renderCover?: (info: ScratchCardCoverRenderInfo) => ReactNode;
  readonly revealDuration?: number;
  readonly theme?: JackpotThemeOverride;
  readonly width: number;
}
export interface ScratchCardRef<TPrize = unknown> {
  reveal(): Promise<ScratchCardResult<TPrize>>;
  reset(): void;
}
