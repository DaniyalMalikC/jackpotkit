import { describe, expect, it } from 'vitest';

import { createGameResult } from './create-game-result.js';
import { createReward } from './create-reward.js';
import { createScratchCardSelection } from './create-scratch-card-selection.js';
import { createWheelSegments } from './create-wheel-segments.js';

describe('testing factories', () => {
  it('creates a deterministic game result with overridable fields', () => {
    expect(createGameResult({ data: { winnerId: 'reward-1' } })).toEqual({
      data: { winnerId: 'reward-1' },
      game: 'test-game',
      id: 'test-result',
      timestamp: 0,
    });

    expect(
      createGameResult({
        data: 42,
        game: 'spin-wheel',
        id: 'custom-result',
        metadata: { source: 'server' },
        timestamp: 100,
      }),
    ).toEqual({
      data: 42,
      game: 'spin-wheel',
      id: 'custom-result',
      metadata: { source: 'server' },
      timestamp: 100,
    });
  });

  it('creates generic non-monetary rewards', () => {
    expect(createReward()).toEqual({ id: 'test-reward' });
    expect(
      createReward({
        id: 'badge',
        label: 'Early adopter',
        metadata: { rarity: 'rare' },
        value: { badgeId: 'early-adopter' },
      }),
    ).toEqual({
      id: 'badge',
      label: 'Early adopter',
      metadata: { rarity: 'rare' },
      value: { badgeId: 'early-adopter' },
    });
  });

  it('creates deterministic wheel segments with per-index overrides', () => {
    const segments = createWheelSegments(3, (index) => ({
      ...(index === 1 ? { color: '#FF00FF' } : {}),
      weight: index + 1,
    }));

    expect(segments).toEqual([
      { id: 'segment-1', label: 'Segment 1', value: 0, weight: 1 },
      {
        color: '#FF00FF',
        id: 'segment-2',
        label: 'Segment 2',
        value: 1,
        weight: 2,
      },
      { id: 'segment-3', label: 'Segment 3', value: 2, weight: 3 },
    ]);
    expect(Object.isFrozen(segments)).toBe(true);
  });

  it('rejects invalid wheel segment counts', () => {
    expect(() => createWheelSegments(0)).toThrow('count must be a positive integer');
  });

  it('creates immutable controlled Scratch Card selections', () => {
    const selection = createScratchCardSelection(
      { couponCode: 'SAVE20' },
      { metadata: { source: 'test' } },
    );

    expect(selection).toEqual({
      metadata: { source: 'test' },
      prize: { couponCode: 'SAVE20' },
    });
    expect(Object.isFrozen(selection)).toBe(true);
    expect(Object.isFrozen(selection.metadata)).toBe(true);
  });
});
