import type { DieDefinition } from '@jackpotkit/core';

export type DieDefinitionFactory = (index: number) => Partial<DieDefinition>;

export function createDiceFixture(
  count = 1,
  sides = 6,
  overrides: DieDefinitionFactory = () => ({}),
): readonly DieDefinition[] {
  if (!Number.isInteger(count) || count <= 0)
    throw new RangeError('count must be a positive integer.');
  if (!Number.isInteger(sides) || sides < 2)
    throw new RangeError('sides must be an integer greater than or equal to 2.');
  return Object.freeze(
    Array.from({ length: count }, (_, index) =>
      Object.freeze({
        id: `die-${index + 1}`,
        label: `Die ${index + 1}`,
        sides,
        ...overrides(index),
      }),
    ),
  );
}
