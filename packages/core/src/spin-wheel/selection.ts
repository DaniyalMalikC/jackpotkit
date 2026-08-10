import { InvalidConfigurationError } from '../errors/index.js';
import { nextRandomValue, type RandomSource } from '../random/index.js';
import { assertValidSpinWheelSegments } from './validation.js';
import type { WheelSegment } from './types.js';

export function selectSpinWheelSegment<TValue>(
  segments: readonly WheelSegment<TValue>[],
  randomSource: RandomSource,
): WheelSegment<TValue> {
  assertValidSpinWheelSegments(segments);

  const totalWeight = segments.reduce((total, segment) => total + (segment.weight ?? 1), 0);
  const target = nextRandomValue(randomSource) * totalWeight;
  let cumulativeWeight = 0;

  for (const segment of segments) {
    cumulativeWeight += segment.weight ?? 1;

    if (target < cumulativeWeight) {
      return segment;
    }
  }

  const fallback = segments.at(-1);

  if (fallback === undefined) {
    throw new InvalidConfigurationError('Spin Wheel selection requires at least one segment.');
  }

  return fallback;
}
