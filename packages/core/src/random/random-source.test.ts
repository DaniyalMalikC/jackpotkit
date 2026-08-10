import { afterEach, describe, expect, it, vi } from 'vitest';

import { InvalidResultError } from '../errors/index.js';
import { MathRandomSource } from './math-random-source.js';
import {
  assertRandomValue,
  isRandomValue,
  nextRandomValue,
  type RandomSource,
} from './random-source.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('random source validation', () => {
  it.each([0, 0.25, 0.999_999])('accepts %s', (value) => {
    expect(isRandomValue(value)).toBe(true);
    expect(() => assertRandomValue(value)).not.toThrow();
  });

  it.each([-0.001, 1, Number.NaN, Number.POSITIVE_INFINITY, '0.5'])('rejects %s', (value) => {
    expect(isRandomValue(value)).toBe(false);
    expect(() => assertRandomValue(value)).toThrow(InvalidResultError);
  });

  it('validates values produced by custom random sources', () => {
    const invalidSource: RandomSource = { next: () => 1 };

    expect(() => nextRandomValue(invalidSource)).toThrow(
      'next() must return a finite number greater than or equal to 0 and less than 1',
    );
  });

  it('uses Math.random only when MathRandomSource is selected', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.375);

    expect(nextRandomValue(new MathRandomSource())).toBe(0.375);
  });
});
