import type {
  DiceResult,
  DiceSelection,
  DieDefinition,
  GameEvent,
  GameEventType,
  GameStatus,
  RandomSource,
  ResultProvider,
} from '@jackpotkit/core';
import type { JackpotTheme, JackpotThemeOverride } from '@jackpotkit/theme';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { EasingFunction } from 'react-native-reanimated';

export interface DiceEventPayload {
  readonly result?: DiceResult;
  readonly error?: unknown;
}
export type DiceEvent = GameEvent<GameEventType, DiceEventPayload>;

export interface DiceCallbacks {
  readonly onReady?: () => void;
  readonly onPlayStart?: () => void;
  readonly onResultRequest?: () => void;
  readonly onResultResolved?: (result: DiceResult) => void;
  readonly onAnimationStart?: (result: DiceResult) => void;
  readonly onRevealStart?: (result: DiceResult) => void;
  readonly onComplete?: (result: DiceResult) => void;
  readonly onReset?: () => void;
  readonly onError?: (error: unknown) => void;
  readonly onEvent?: (event: DiceEvent) => void;
  readonly onStatusChange?: (status: GameStatus) => void;
}

export interface UseDiceOptions<TRequest = void> extends DiceCallbacks {
  readonly dice?: readonly DieDefinition[];
  readonly count?: number;
  readonly sides?: number;
  readonly randomSource?: RandomSource;
  readonly result?: DiceSelection;
  readonly resultProvider?: ResultProvider<TRequest, DiceSelection>;
  readonly resultRequest?: TRequest;
  readonly disabled?: boolean;
}

export interface UseDiceReturn {
  readonly status: GameStatus;
  readonly result: DiceResult | undefined;
  readonly error: unknown;
  roll(): Promise<DiceResult>;
  rollTo(selection: DiceSelection): Promise<DiceResult>;
  reset(): void;
}

export interface DieRenderInfo {
  readonly die: DieDefinition;
  readonly index: number;
  readonly value: number;
  readonly rolling: boolean;
  readonly theme: JackpotTheme;
}

export type DiceFaceStyle = 'numbers' | 'pips';

export interface DiceProps<TRequest = void> extends UseDiceOptions<TRequest> {
  readonly accessibilityLabel?: string;
  readonly duration?: number;
  readonly easing?: EasingFunction;
  readonly reduceMotion?: boolean;
  readonly renderDie?: (info: DieRenderInfo) => ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly theme?: JackpotThemeOverride;
  /** `pips` renders conventional dots for D6 dice and a beveled number for other dice. */
  readonly faceStyle?: DiceFaceStyle;
  readonly width?: number;
}

export interface DiceRef {
  roll(): Promise<DiceResult>;
  rollTo(selection: DiceSelection): Promise<DiceResult>;
  reset(): void;
}
