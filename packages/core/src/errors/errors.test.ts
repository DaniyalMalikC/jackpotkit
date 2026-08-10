import { describe, expect, it } from 'vitest';

import {
  GameStateError,
  InvalidConfigurationError,
  InvalidResultError,
  JackpotKitError,
  ResultProviderError,
} from './index.js';

describe('JackpotKit errors', () => {
  it('preserves stable codes, causes, and immutable metadata', () => {
    const cause = new Error('upstream');
    const error = new JackpotKitError('CUSTOM_ERROR', 'Something failed.', {
      cause,
      metadata: { operation: 'play' },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('JackpotKitError');
    expect(error.code).toBe('CUSTOM_ERROR');
    expect(error.cause).toBe(cause);
    expect(error.metadata).toEqual({ operation: 'play' });
    expect(Object.isFrozen(error.metadata)).toBe(true);
  });

  it.each([
    [InvalidConfigurationError, 'INVALID_CONFIGURATION'],
    [InvalidResultError, 'INVALID_RESULT'],
    [ResultProviderError, 'RESULT_PROVIDER_ERROR'],
    [GameStateError, 'GAME_STATE_ERROR'],
  ] as const)('provides %s with its public code', (ErrorType, code) => {
    const error = new ErrorType('Actionable message.');

    expect(error).toBeInstanceOf(JackpotKitError);
    expect(error.name).toBe(ErrorType.name);
    expect(error.code).toBe(code);
  });
});
