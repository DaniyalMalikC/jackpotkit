import { describe, expect, it } from 'vitest';

import { InvalidConfigurationError } from '../errors/index.js';
import { SeededRandomSource } from './seeded-random-source.js';

describe('SeededRandomSource', () => {
  it('keeps the documented Mulberry32 sequence stable', () => {
    const source = new SeededRandomSource(123_456_789);

    expect(Array.from({ length: 5 }, () => source.next())).toEqual([
      0.2577907438389957, 0.9707721115555614, 0.7853280142880976, 0.20616457983851433,
      0.30307188746519387,
    ]);
  });

  it('replays the sequence after reset', () => {
    const source = new SeededRandomSource('replay-id');
    const first = [source.next(), source.next(), source.next()];

    source.reset();

    expect([source.next(), source.next(), source.next()]).toEqual(first);
  });

  it('produces equal sequences for equal string seeds and different sequences for different seeds', () => {
    const first = new SeededRandomSource('alpha');
    const second = new SeededRandomSource('alpha');
    const other = new SeededRandomSource('beta');

    const firstSequence = [first.next(), first.next(), first.next()];

    expect([second.next(), second.next(), second.next()]).toEqual(firstSequence);
    expect([other.next(), other.next(), other.next()]).not.toEqual(firstSequence);
    expect(firstSequence.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid numeric seed %s',
    (seed) => {
      expect(() => new SeededRandomSource(seed)).toThrow(InvalidConfigurationError);
    },
  );
});
