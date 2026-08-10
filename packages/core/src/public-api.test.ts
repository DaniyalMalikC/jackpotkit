import { describe, expect, it } from 'vitest';

describe('@jackpotkit/core public entrypoint', () => {
  it('initializes safely in Node and exposes the intentional Phase 2 runtime API', async () => {
    const core = await import('./index.js');

    expect(Object.keys(core).sort()).toEqual(
      [
        'AnimationError',
        'GAME_EVENT_TYPES',
        'GAME_STATUSES',
        'GameStateError',
        'InvalidConfigurationError',
        'InvalidResultError',
        'InvalidSegmentError',
        'JackpotKitError',
        'MathRandomSource',
        'ResultProviderError',
        'SeededRandomSource',
        'assertRandomValue',
        'assertValidConfiguration',
        'assertValidResult',
        'assertValidSpinWheelSegments',
        'assertValidSpinWheelSelection',
        'calculateSpinWheelDestination',
        'createSpinWheel',
        'createGameEvent',
        'createValidationResult',
        'isGameStatus',
        'isRandomValue',
        'nextRandomValue',
        'resolveResult',
        'selectSpinWheelSegment',
        'validateSpinWheelSegments',
        'validateSpinWheelSelection',
      ].sort(),
    );
  });
});
