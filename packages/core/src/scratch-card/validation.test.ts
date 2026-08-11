import { describe, expect, it } from 'vitest';

import { InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import {
  assertValidScratchCardConfiguration,
  assertValidScratchCardSelection,
  assertValidScratchProgress,
  validateScratchCardConfiguration,
} from './validation.js';

describe('Scratch Card validation', () => {
  it('accepts valid dimensions and thresholds', () => {
    expect(
      validateScratchCardConfiguration({
        brushRadius: 18,
        cellSize: 6,
        height: 180,
        threshold: 0.65,
        width: 320,
      }),
    ).toEqual({ valid: true, issues: [] });
  });

  it.each([
    [{ threshold: 0 }, 'threshold'],
    [{ threshold: 1.1 }, 'threshold'],
    [{ width: 0 }, 'width'],
    [{ height: Number.NaN }, 'height'],
    [{ brushRadius: -1 }, 'brushRadius'],
  ])('rejects invalid configuration %o', (configuration, expectedPath) => {
    const result = validateScratchCardConfiguration(configuration);
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.path).toEqual([expectedPath]);
    expect(() => assertValidScratchCardConfiguration(configuration)).toThrow(
      InvalidConfigurationError,
    );
  });

  it('validates result envelopes and progress', () => {
    expect(() => assertValidScratchCardSelection({ prize: 'coupon' })).not.toThrow();
    expect(() => assertValidScratchCardSelection(null)).toThrow(InvalidResultError);
    expect(() => assertValidScratchCardSelection({ metadata: 'server' })).toThrow(
      InvalidResultError,
    );
    expect(() => assertValidScratchProgress(0.75)).not.toThrow();
    expect(() => assertValidScratchProgress(1.01)).toThrow(InvalidConfigurationError);
  });
});
