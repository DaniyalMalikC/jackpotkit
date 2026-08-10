import { describe, expect, it } from 'vitest';

import { InvalidConfigurationError, InvalidSegmentError } from '../errors/index.js';
import { calculateSpinWheelDestination } from './destination.js';

describe('Spin Wheel destination rotation', () => {
  it('centers the selected equal-sized segment under the top pointer clockwise', () => {
    expect(calculateSpinWheelDestination({ rotations: 0, segmentCount: 4, segmentIndex: 0 })).toBe(
      315,
    );
    expect(calculateSpinWheelDestination({ rotations: 0, segmentCount: 4, segmentIndex: 3 })).toBe(
      45,
    );
    expect(calculateSpinWheelDestination({ rotations: 2, segmentCount: 4, segmentIndex: 1 })).toBe(
      945,
    );
  });

  it('continues from the current rotation and supports counter-clockwise motion', () => {
    expect(
      calculateSpinWheelDestination({
        currentRotation: 350,
        rotations: 0,
        segmentCount: 4,
        segmentIndex: 0,
      }),
    ).toBe(675);
    expect(
      calculateSpinWheelDestination({
        direction: 'counter-clockwise',
        rotations: 0,
        segmentCount: 4,
        segmentIndex: 0,
      }),
    ).toBe(-45);
  });

  it('supports a pointer offset without changing segment geometry', () => {
    expect(
      calculateSpinWheelDestination({
        pointerAngle: 90,
        rotations: 0,
        segmentCount: 4,
        segmentIndex: 0,
      }),
    ).toBe(45);
  });

  it('rejects invalid geometry and animation inputs', () => {
    expect(() => calculateSpinWheelDestination({ segmentCount: 0, segmentIndex: 0 })).toThrow(
      InvalidConfigurationError,
    );
    expect(() => calculateSpinWheelDestination({ segmentCount: 4, segmentIndex: 4 })).toThrow(
      InvalidSegmentError,
    );
    expect(() =>
      calculateSpinWheelDestination({ rotations: 1.5, segmentCount: 4, segmentIndex: 0 }),
    ).toThrow('rotations must be a non-negative integer');
  });
});
