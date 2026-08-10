import type { GameResult } from '@jackpotkit/core';

export interface CreateGameResultOptions<TData> {
  readonly data: TData;
  readonly game?: string;
  readonly id?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly timestamp?: number;
}

export function createGameResult<TData>(
  options: CreateGameResultOptions<TData>,
): GameResult<TData> {
  return {
    id: options.id ?? 'test-result',
    game: options.game ?? 'test-game',
    data: options.data,
    timestamp: options.timestamp ?? 0,
    ...(options.metadata === undefined ? {} : { metadata: { ...options.metadata } }),
  };
}
