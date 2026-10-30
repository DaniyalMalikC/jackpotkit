import type { GameStatus } from '@jackpotkit/core';

/**
 * True while a play has started and not yet completed, failed, or been reset. Primary actions must
 * stay disabled for this whole window: a one-shot controller resolves controlled and random results
 * synchronously, so the renderer's own animation flag is not set until a microtask later and a fast
 * second activation would otherwise resolve a second result.
 */
export function isPlayInFlight(status: GameStatus): boolean {
  return status === 'playing' || status === 'requesting-result' || status === 'revealing';
}
