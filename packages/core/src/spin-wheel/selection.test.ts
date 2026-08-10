import { describe, expect, it } from 'vitest';

import type { RandomSource } from '../random/index.js';
import { selectSpinWheelSegment } from './selection.js';

function fixedRandom(value: number): RandomSource {
  return { next: () => value };
}

describe('Spin Wheel selection', () => {
  it('selects uniformly when weights are omitted', () => {
    const segments = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];

    expect(selectSpinWheelSegment(segments, fixedRandom(0)).id).toBe('one');
    expect(selectSpinWheelSegment(segments, fixedRandom(1 / 3)).id).toBe('two');
    expect(selectSpinWheelSegment(segments, fixedRandom(0.999_999)).id).toBe('three');
  });

  it('uses weights only for probability selection', () => {
    const segments = [
      { id: 'common', weight: 9 },
      { id: 'rare', weight: 1 },
    ];

    expect(selectSpinWheelSegment(segments, fixedRandom(0.899_999)).id).toBe('common');
    expect(selectSpinWheelSegment(segments, fixedRandom(0.9)).id).toBe('rare');
  });
});
