import { describe, expect, it } from 'vitest';

describe('@jackpotkit/testing public entrypoint', () => {
  it('exposes only intentional Phase 2 runtime helpers', async () => {
    const testing = await import('./index.js');

    expect(Object.keys(testing).sort()).toEqual(
      [
        'MockResultProvider',
        'SequenceRandomSource',
        'createGameResult',
        'createReward',
        'createSequenceRandom',
        'createWheelSegments',
      ].sort(),
    );
  });
});
