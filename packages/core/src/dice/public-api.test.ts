import { describe, expect, it } from 'vitest';

describe('@jackpotkit/core/dice public entrypoint', () => {
  it('exposes only the intentional Dice runtime API', async () => {
    const dice = await import('./index.js');
    expect(Object.keys(dice).sort()).toEqual(
      [
        'assertValidDiceDefinitions',
        'assertValidDiceSelection',
        'createDice',
        'createDiceDefinitions',
      ].sort(),
    );
  });
});
