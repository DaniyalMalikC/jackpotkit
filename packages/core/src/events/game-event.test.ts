import { describe, expect, it, vi } from 'vitest';

import { GAME_EVENT_TYPES, createGameEvent } from './game-event.js';

describe('game events', () => {
  it('exposes the standard event vocabulary', () => {
    expect(GAME_EVENT_TYPES).toEqual([
      'ready',
      'play-start',
      'result-request',
      'result-resolved',
      'animation-start',
      'reveal-start',
      'progress',
      'complete',
      'reset',
      'error',
    ]);
  });

  it('creates typed immutable event envelopes', () => {
    const event = createGameEvent(
      'complete',
      { winnerId: 'reward-2' },
      { metadata: { mode: 'server' }, timestamp: 1_700_000_000_000 },
    );

    expect(event).toEqual({
      metadata: { mode: 'server' },
      payload: { winnerId: 'reward-2' },
      timestamp: 1_700_000_000_000,
      type: 'complete',
    });
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.metadata)).toBe(true);
  });

  it('uses the current time when a timestamp is not supplied', () => {
    vi.spyOn(Date, 'now').mockReturnValue(42);

    expect(createGameEvent('ready', undefined).timestamp).toBe(42);
  });
});
