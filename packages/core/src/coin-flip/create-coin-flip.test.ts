import { describe, expect, it } from 'vitest';

import { GameStateError, InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import { createCoinFlip } from './create-coin-flip.js';

describe('Coin Flip engine', () => {
  it('selects both default faces with equal random halves', () => {
    const randomValues = [0.49, 0.5];
    const coin = createCoinFlip({ randomSource: { next: () => randomValues.shift() as number } });

    expect(coin.flip().faceId).toBe('heads');
    expect(coin.flip().faceId).toBe('tails');
  });

  it('supports custom faces, controlled outcomes, and provider metadata', async () => {
    const coin = createCoinFlip({
      faces: [
        { id: 'sun', label: 'Sun', value: 1 },
        { id: 'moon', label: 'Moon', value: 2 },
      ],
      now: () => 100,
    });
    expect(coin.flipTo({ faceId: 'moon' })).toMatchObject({
      data: { faceId: 'moon', value: 2 },
      timestamp: 100,
    });
    const result = await coin.flipWith(
      async () => ({ faceId: 'sun', metadata: { authority: 'server' } }),
      undefined,
    );
    expect(result.metadata).toEqual({ authority: 'server' });
  });

  it('validates exactly two unique faces and known controlled outcomes', () => {
    expect(() => createCoinFlip({ faces: [{ id: 'only' }] })).toThrow(InvalidConfigurationError);
    expect(() => createCoinFlip({ faces: [{ id: 'same' }, { id: 'same' }] })).toThrow(
      'duplicate face ID',
    );
    expect(() => createCoinFlip().flipTo({ faceId: 'edge' })).toThrow(InvalidResultError);
  });

  it('invalidates provider results after reset', async () => {
    let resolveSelection: ((selection: { faceId: string }) => void) | undefined;
    const coin = createCoinFlip();
    const pending = coin.flipWith(
      () => new Promise((resolve) => (resolveSelection = resolve)),
      undefined,
    );
    coin.reset();
    resolveSelection?.({ faceId: 'heads' });
    await expect(pending).rejects.toThrow(GameStateError);
  });
});
