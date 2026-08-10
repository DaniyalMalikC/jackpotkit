import { describe, expect, it } from 'vitest';

describe('@jackpotkit/core public entrypoint', () => {
  it('initializes safely in Node and exposes the intentional Phase 1 runtime API', async () => {
    const core = await import('./index.js');

    expect(Object.keys(core).sort()).toEqual(
      [
        'GAME_EVENT_TYPES',
        'GAME_STATUSES',
        'GameStateError',
        'InvalidConfigurationError',
        'InvalidResultError',
        'JackpotKitError',
        'MathRandomSource',
        'ResultProviderError',
        'SeededRandomSource',
        'assertRandomValue',
        'assertValidConfiguration',
        'assertValidResult',
        'createGameEvent',
        'createValidationResult',
        'isGameStatus',
        'isRandomValue',
        'nextRandomValue',
        'resolveResult',
      ].sort(),
    );
  });
});
