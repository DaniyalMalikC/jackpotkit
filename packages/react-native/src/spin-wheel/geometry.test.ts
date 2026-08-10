import { createSegmentPath, getSegmentLabelPosition } from './geometry';

describe('Spin Wheel renderer geometry', () => {
  it('creates equal visual slices regardless of result weights', () => {
    expect(createSegmentPath(0, 4, 200)).toBe('M 100 100 L 100 0 A 100 100 0 0 1 200 100 Z');
    expect(createSegmentPath(1, 4, 200)).toBe('M 100 100 L 200 100 A 100 100 0 0 1 100 200 Z');
  });

  it('positions labels at each equal segment midpoint', () => {
    const first = getSegmentLabelPosition(0, 4, 200);
    const third = getSegmentLabelPosition(2, 4, 200);

    expect(first.x).toBeCloseTo(143.840_62);
    expect(first.y).toBeCloseTo(56.159_38);
    expect(third.x).toBeCloseTo(56.159_38);
    expect(third.y).toBeCloseTo(143.840_62);
  });
});
