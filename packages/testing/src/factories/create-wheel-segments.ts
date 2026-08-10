import { InvalidConfigurationError, type WheelSegment } from '@jackpotkit/core';

export type WheelSegmentFactory<TValue = number> = (index: number) => Partial<WheelSegment<TValue>>;

export function createWheelSegments(count: number): readonly WheelSegment<number>[];
export function createWheelSegments<TValue>(
  count: number,
  factory: WheelSegmentFactory<TValue>,
): readonly WheelSegment<TValue>[];
export function createWheelSegments(
  count: number,
  factory?: WheelSegmentFactory<unknown>,
): readonly WheelSegment<unknown>[] {
  if (!Number.isInteger(count) || count <= 0) {
    throw new InvalidConfigurationError('createWheelSegments count must be a positive integer.', {
      metadata: { count },
    });
  }

  return Object.freeze(
    Array.from({ length: count }, (_, index) => {
      const override = factory?.(index) ?? {};

      return Object.freeze({
        ...override,
        id: override.id ?? `segment-${index + 1}`,
        label: override.label ?? `Segment ${index + 1}`,
        value: 'value' in override ? override.value : index,
      });
    }),
  );
}
