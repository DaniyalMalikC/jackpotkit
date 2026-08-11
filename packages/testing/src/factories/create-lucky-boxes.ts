import type { LuckyBoxItem } from '@jackpotkit/core';

export type LuckyBoxFactory<TReward = number> = (index: number) => Partial<LuckyBoxItem<TReward>>;

export function createLuckyBoxes<TReward = number>(
  count: number,
  overrides: LuckyBoxFactory<TReward> = () => ({}),
): readonly LuckyBoxItem<TReward>[] {
  if (!Number.isInteger(count) || count <= 0)
    throw new RangeError('count must be a positive integer.');
  return Object.freeze(
    Array.from({ length: count }, (_, index) =>
      Object.freeze({ id: `box-${index + 1}`, label: `Box ${index + 1}`, ...overrides(index) }),
    ),
  );
}
