import { InvalidConfigurationError } from '../errors/index.js';
import { nextRandomValue, type RandomSource } from '../random/index.js';
import type { SlotMachineSelection, SlotSymbol } from './types.js';
import { assertValidSlotSymbols } from './validation.js';

export function selectSlotSymbol<TValue>(
  symbols: readonly SlotSymbol<TValue>[],
  randomSource: RandomSource,
): SlotSymbol<TValue> {
  assertValidSlotSymbols(symbols);
  const totalWeight = symbols.reduce((total, symbol) => total + (symbol.weight ?? 1), 0);
  const target = nextRandomValue(randomSource) * totalWeight;
  let cumulative = 0;

  for (const symbol of symbols) {
    cumulative += symbol.weight ?? 1;
    if (target < cumulative) return symbol;
  }

  return symbols[symbols.length - 1] as SlotSymbol<TValue>;
}

export function createRandomSlotSelection<TValue>(
  symbols: readonly SlotSymbol<TValue>[],
  reelCount: number,
  rowCount: number,
  randomSource: RandomSource,
): SlotMachineSelection {
  assertValidSlotSymbols(symbols);
  if (
    !Number.isInteger(reelCount) ||
    reelCount <= 0 ||
    !Number.isInteger(rowCount) ||
    rowCount <= 0
  ) {
    throw new InvalidConfigurationError(
      'Slot Machine reelCount and rowCount must be positive integers.',
    );
  }

  return Object.freeze({
    reels: Object.freeze(
      Array.from({ length: reelCount }, () =>
        Object.freeze(
          Array.from({ length: rowCount }, () => selectSlotSymbol(symbols, randomSource).id),
        ),
      ),
    ),
  });
}
