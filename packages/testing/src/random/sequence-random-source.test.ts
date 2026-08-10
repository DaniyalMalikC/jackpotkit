import { GameStateError, InvalidConfigurationError, nextRandomValue } from '@jackpotkit/core';
import { describe, expect, it } from 'vitest';

import { SequenceRandomSource, createSequenceRandom } from './sequence-random-source.js';

describe('SequenceRandomSource', () => {
  it('returns values in order and tracks its position', () => {
    const source = createSequenceRandom([0.1, 0.75, 0.3]);

    expect(nextRandomValue(source)).toBe(0.1);
    expect(nextRandomValue(source)).toBe(0.75);
    expect(source.index).toBe(2);
    expect(nextRandomValue(source)).toBe(0.3);
  });

  it('fails clearly when a finite sequence is exhausted', () => {
    const source = new SequenceRandomSource([0]);
    source.next();

    expect(() => source.next()).toThrow(GameStateError);
    expect(() => source.next()).toThrow('SequenceRandomSource is exhausted');
  });

  it('can loop when repeated values are intentional', () => {
    const source = new SequenceRandomSource([0.2, 0.8], { loop: true });

    expect([source.next(), source.next(), source.next()]).toEqual([0.2, 0.8, 0.2]);
  });

  it('replays from the beginning after reset', () => {
    const source = new SequenceRandomSource([0.25, 0.5]);
    source.next();
    source.reset();

    expect(source.index).toBe(0);
    expect(source.next()).toBe(0.25);
  });

  it('rejects empty and out-of-range sequences as invalid configuration', () => {
    expect(() => new SequenceRandomSource([])).toThrow(InvalidConfigurationError);
    expect(() => new SequenceRandomSource([0.2, 1])).toThrow(
      'value at index 1 must be greater than or equal to 0 and less than 1',
    );
  });
});
