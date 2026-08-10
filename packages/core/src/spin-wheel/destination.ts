import { InvalidConfigurationError, InvalidSegmentError } from '../errors/index.js';
import type { SpinWheelDestinationOptions } from './types.js';

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function calculateSpinWheelDestination({
  currentRotation = 0,
  direction = 'clockwise',
  pointerAngle = 0,
  rotations = 6,
  segmentCount,
  segmentIndex,
}: SpinWheelDestinationOptions): number {
  if (!Number.isInteger(segmentCount) || segmentCount <= 0) {
    throw new InvalidConfigurationError('segmentCount must be a positive integer.');
  }

  if (!Number.isInteger(segmentIndex) || segmentIndex < 0 || segmentIndex >= segmentCount) {
    throw new InvalidSegmentError(
      `segmentIndex must be an integer between 0 and ${segmentCount - 1}.`,
      { metadata: { segmentCount, segmentIndex } },
    );
  }

  if (!Number.isFinite(currentRotation)) {
    throw new InvalidConfigurationError('currentRotation must be finite.');
  }

  if (!Number.isFinite(pointerAngle)) {
    throw new InvalidConfigurationError('pointerAngle must be finite.');
  }

  if (!Number.isInteger(rotations) || rotations < 0) {
    throw new InvalidConfigurationError('rotations must be a non-negative integer.');
  }

  const segmentAngle = 360 / segmentCount;
  const segmentCenter = (segmentIndex + 0.5) * segmentAngle;
  const targetRotation = normalizeDegrees(pointerAngle - segmentCenter);
  const normalizedCurrent = normalizeDegrees(currentRotation);

  if (direction === 'counter-clockwise') {
    const alignment = normalizeDegrees(normalizedCurrent - targetRotation);
    return currentRotation - rotations * 360 - alignment;
  }

  const alignment = normalizeDegrees(targetRotation - normalizedCurrent);
  return currentRotation + rotations * 360 + alignment;
}
