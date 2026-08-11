import { describe, expect, it } from 'vitest';

describe('@jackpotkit/core public entrypoint', () => {
  it('initializes safely in Node and exposes the intentional Phase 4 runtime API', async () => {
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
        'assertValidScratchCardConfiguration',
        'assertValidScratchCardSelection',
        'assertValidScratchPoint',
        'assertValidScratchProgress',
        'assertValidSlotMachineConfiguration',
        'assertValidSlotMachineSelection',
        'assertValidSlotSymbols',
        'assertValidSpinWheelSegments',
        'assertValidSpinWheelSelection',
        'calculateSpinWheelDestination',
        'createDefaultSlotPaylines',
        'createRandomSlotSelection',
        'createSpinWheel',
        'createGameEvent',
        'createScratchCard',
        'createScratchProgressTracker',
        'createSlotMachine',
        'createValidationResult',
        'evaluateSlotPaylines',
        'isGameStatus',
        'isRandomValue',
        'nextRandomValue',
        'resolveResult',
        'selectSlotSymbol',
        'selectSpinWheelSegment',
        'validateScratchCardConfiguration',
        'validateSlotMachineConfiguration',
        'validateSlotSymbols',
        'validateSpinWheelSegments',
        'validateSpinWheelSelection',
      ].sort(),
    );
  });
});
