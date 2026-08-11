import type { SlotSymbol } from '@jackpotkit/core';

export type SlotSymbolFactory<TValue = number> = (index: number) => Partial<SlotSymbol<TValue>>;

export function createSlotSymbols<TValue = number>(
  count: number,
  overrides: SlotSymbolFactory<TValue> = () => ({}),
): readonly SlotSymbol<TValue>[] {
  if (!Number.isInteger(count) || count <= 0) {
    throw new RangeError('count must be a positive integer.');
  }

  return Object.freeze(
    Array.from({ length: count }, (_, index) =>
      Object.freeze({
        id: `symbol-${index + 1}`,
        label: `Symbol ${index + 1}`,
        value: index as TValue,
        weight: 1,
        ...overrides(index),
      }),
    ),
  );
}
