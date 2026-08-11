export const GAME_EVENT_TYPES = Object.freeze([
  'ready',
  'play-start',
  'result-request',
  'result-resolved',
  'animation-start',
  'reel-stop',
  'reveal-start',
  'progress',
  'complete',
  'reset',
  'error',
] as const);

export type GameEventType = (typeof GAME_EVENT_TYPES)[number];

export interface GameEvent<TType extends GameEventType = GameEventType, TPayload = unknown> {
  readonly type: TType;
  readonly timestamp: number;
  readonly payload: TPayload;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type GameEventHandler<TEvent extends GameEvent = GameEvent> = (event: TEvent) => void;

export interface CreateGameEventOptions {
  readonly timestamp?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function createGameEvent<TType extends GameEventType, TPayload>(
  type: TType,
  payload: TPayload,
  options: CreateGameEventOptions = {},
): GameEvent<TType, TPayload> {
  const event = {
    type,
    timestamp: options.timestamp ?? Date.now(),
    payload,
    ...(options.metadata === undefined ? {} : { metadata: Object.freeze({ ...options.metadata }) }),
  };

  return Object.freeze(event);
}
