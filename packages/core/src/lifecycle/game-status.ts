export const GAME_STATUSES = Object.freeze([
  'idle',
  'ready',
  'requesting-result',
  'playing',
  'revealing',
  'completed',
  'disabled',
  'error',
  'resetting',
] as const);

export type GameStatus = (typeof GAME_STATUSES)[number];

export function isGameStatus(value: unknown): value is GameStatus {
  return typeof value === 'string' && (GAME_STATUSES as readonly string[]).includes(value);
}
