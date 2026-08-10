import { describe, expect, it } from 'vitest';

import { GAME_STATUSES, isGameStatus } from './game-status.js';

describe('game status conventions', () => {
  it('exposes the complete shared vocabulary without prescribing transitions', () => {
    expect(GAME_STATUSES).toEqual([
      'idle',
      'ready',
      'requesting-result',
      'playing',
      'revealing',
      'completed',
      'disabled',
      'error',
      'resetting',
    ]);
    expect(Object.isFrozen(GAME_STATUSES)).toBe(true);
  });

  it('recognizes only supported statuses', () => {
    expect(GAME_STATUSES.every(isGameStatus)).toBe(true);
    expect(isGameStatus('pending')).toBe(false);
    expect(isGameStatus(null)).toBe(false);
  });
});
