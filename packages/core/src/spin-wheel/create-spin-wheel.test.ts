import { describe, expect, it, vi } from 'vitest';

import { GameStateError, InvalidSegmentError, ResultProviderError } from '../errors/index.js';
import { createSpinWheel } from './create-spin-wheel.js';

describe('createSpinWheel', () => {
  it('supports deterministic random headless spins and immutable results', () => {
    const wheel = createSpinWheel({
      now: () => 1_700_000_000_000,
      randomSource: { next: () => 0.75 },
      segments: [
        { id: 'first', value: 10 },
        { id: 'second', metadata: { tier: 'rare' }, value: 50 },
      ],
    });

    const result = wheel.spin();

    expect(result).toMatchObject({
      data: { segmentId: 'second', value: 50 },
      game: 'spin-wheel',
      id: 'spin-wheel-1',
      segmentId: 'second',
      timestamp: 1_700_000_000_000,
    });
    expect(wheel.status).toBe('completed');
    expect(wheel.result).toBe(result);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.segment)).toBe(true);
  });

  it('supports controlled selection and reset', () => {
    const wheel = createSpinWheel({ segments: [{ id: 'one' }, { id: 'two' }] });

    expect(wheel.spinTo('two').segmentId).toBe('two');
    expect(() => wheel.spinTo('missing')).toThrow(InvalidSegmentError);
    expect(wheel.status).toBe('error');

    wheel.reset();

    expect(wheel.status).toBe('ready');
    expect(wheel.result).toBeUndefined();
  });

  it('resolves synchronous and asynchronous authoritative providers', async () => {
    const wheel = createSpinWheel({ segments: [{ id: 'server-winner' }] });

    await expect(
      wheel.spinWith(() => ({ segmentId: 'server-winner' }), undefined),
    ).resolves.toMatchObject({ segmentId: 'server-winner' });
    await expect(
      wheel.spinWith(
        async (campaign: string) => Promise.resolve({ segmentId: campaign }),
        'server-winner',
      ),
    ).resolves.toMatchObject({ segmentId: 'server-winner' });
  });

  it('normalizes provider errors and rejects unknown server results', async () => {
    const wheel = createSpinWheel({ segments: [{ id: 'known' }] });

    await expect(
      wheel.spinWith(() => {
        throw new Error('offline');
      }, undefined),
    ).rejects.toBeInstanceOf(ResultProviderError);
    expect(wheel.status).toBe('error');

    await expect(
      wheel.spinWith(() => ({ segmentId: 'unknown' }), undefined),
    ).rejects.toBeInstanceOf(InvalidSegmentError);
  });

  it('prevents overlapping requests and ignores a provider result after reset', async () => {
    let resolveProvider: ((selection: { segmentId: string }) => void) | undefined;
    const provider = vi.fn(
      () =>
        new Promise<{ segmentId: string }>((resolve) => {
          resolveProvider = resolve;
        }),
    );
    const wheel = createSpinWheel({ segments: [{ id: 'known' }] });
    const pending = wheel.spinWith(provider, undefined);

    expect(wheel.status).toBe('requesting-result');
    expect(() => wheel.spin()).toThrow(GameStateError);

    wheel.reset();
    resolveProvider?.({ segmentId: 'known' });

    await expect(pending).rejects.toThrow('reset before its result resolved');
    expect(wheel.status).toBe('ready');
    expect(wheel.result).toBeUndefined();
  });
});
