import { describe, expect, it } from 'vitest';

import { InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import {
  assertValidConfiguration,
  assertValidResult,
  createValidationResult,
} from './validation-result.js';

describe('validation results', () => {
  it('represents successful validation without issues', () => {
    const result = createValidationResult([]);

    expect(result).toEqual({ issues: [], valid: true });
    expect(() => assertValidConfiguration(result)).not.toThrow();
    expect(() => assertValidResult(result)).not.toThrow();
  });

  it('freezes copied issues so caller-owned input cannot mutate the result', () => {
    const path = ['segments', 0, 'id'] as const;
    const result = createValidationResult([
      { code: 'REQUIRED', message: 'An ID is required.', path },
    ]);

    expect(result.valid).toBe(false);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.issues)).toBe(true);
    expect(Object.isFrozen(result.issues[0]?.path)).toBe(true);
  });

  it('throws actionable configuration errors with structured issues', () => {
    const result = createValidationResult([
      {
        code: 'DUPLICATE_ID',
        message: 'IDs must be unique.',
        path: ['segments', 1, 'id'],
      },
    ]);

    expect(() => assertValidConfiguration(result, 'Invalid wheel configuration.')).toThrow(
      'Invalid wheel configuration. segments[1].id: IDs must be unique.',
    );

    try {
      assertValidConfiguration(result);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidConfigurationError);
      expect(error).toMatchObject({ metadata: { issues: result.issues } });
    }
  });

  it('uses InvalidResultError for supplied-result validation', () => {
    const result = createValidationResult([
      { code: 'UNKNOWN_RESULT', message: 'The selected result does not exist.' },
    ]);

    expect(() => assertValidResult(result)).toThrow(InvalidResultError);
  });
});
