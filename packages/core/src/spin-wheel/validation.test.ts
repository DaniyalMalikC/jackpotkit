import { describe, expect, it } from 'vitest';

import { InvalidConfigurationError, InvalidSegmentError } from '../errors/index.js';
import {
  assertValidSpinWheelSegments,
  assertValidSpinWheelSelection,
  validateSpinWheelSegments,
  validateSpinWheelSelection,
} from './validation.js';

describe('Spin Wheel validation', () => {
  it('accepts a valid mixed weighted configuration', () => {
    const result = validateSpinWheelSegments([{ id: 'common' }, { id: 'rare', weight: 0.25 }]);

    expect(result).toEqual({ issues: [], valid: true });
  });

  it('reports empty, duplicate, blank, and invalid weighted segments together', () => {
    expect(validateSpinWheelSegments([])).toMatchObject({
      issues: [{ code: 'EMPTY_SEGMENTS', path: ['segments'] }],
      valid: false,
    });

    const result = validateSpinWheelSegments([
      { id: 'same', weight: 0 },
      { id: 'same', weight: -1 },
      { id: '   ', weight: Number.NaN },
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'INVALID_SEGMENT_WEIGHT',
      'DUPLICATE_SEGMENT_ID',
      'INVALID_SEGMENT_WEIGHT',
      'EMPTY_SEGMENT_ID',
      'INVALID_SEGMENT_WEIGHT',
    ]);
    expect(() => assertValidSpinWheelSegments([])).toThrow(InvalidConfigurationError);
  });

  it('rejects a non-finite total weight', () => {
    const result = validateSpinWheelSegments([
      { id: 'one', weight: Number.MAX_VALUE },
      { id: 'two', weight: Number.MAX_VALUE },
    ]);

    expect(result).toMatchObject({ valid: false });
    expect(result.issues.some((issue) => issue.code === 'INVALID_TOTAL_WEIGHT')).toBe(true);
  });

  it('validates supplied result shapes and known IDs', () => {
    const segments = [{ id: 'one' }, { id: 'two' }];

    expect(validateSpinWheelSelection(segments, { segmentId: 'two' }).valid).toBe(true);
    expect(validateSpinWheelSelection(segments, null)).toMatchObject({ valid: false });
    expect(validateSpinWheelSelection(segments, { segmentId: 'missing' })).toMatchObject({
      issues: [{ code: 'UNKNOWN_SEGMENT_ID' }],
      valid: false,
    });
    expect(() => assertValidSpinWheelSelection(segments, { segmentId: 'missing' })).toThrow(
      InvalidSegmentError,
    );
  });
});
