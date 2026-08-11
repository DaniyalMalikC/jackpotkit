import { describe, expect, it } from 'vitest';

describe('@jackpotkit/core/coin-flip public entrypoint', () => {
  it('exposes only the intentional Coin Flip runtime API', async () => {
    const coin = await import('./index.js');
    expect(Object.keys(coin).sort()).toEqual(
      [
        'DEFAULT_COIN_FACES',
        'assertValidCoinFaces',
        'assertValidCoinFlipSelection',
        'createCoinFlip',
      ].sort(),
    );
  });
});
