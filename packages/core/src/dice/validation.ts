import { InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import type { DiceSelection, DieDefinition } from './types.js';

export function assertValidDiceDefinitions(dice: readonly DieDefinition[]): void {
  if (!Array.isArray(dice) || dice.length === 0) {
    throw new InvalidConfigurationError('Dice requires at least one die.');
  }

  const ids = new Set<string>();
  for (const [index, die] of dice.entries()) {
    if (typeof die?.id !== 'string' || die.id.trim().length === 0) {
      throw new InvalidConfigurationError(`Die ${index + 1} must have a non-empty ID.`);
    }
    if (ids.has(die.id)) {
      throw new InvalidConfigurationError(`Dice contains duplicate die ID "${die.id}".`);
    }
    if (!Number.isSafeInteger(die.sides) || die.sides < 2) {
      throw new InvalidConfigurationError(`Die "${die.id}" must have at least 2 integer sides.`);
    }
    ids.add(die.id);
  }
}

export function createDiceDefinitions(count = 1, sides = 6): readonly DieDefinition[] {
  if (!Number.isSafeInteger(count) || count <= 0) {
    throw new InvalidConfigurationError('Dice count must be a positive integer.');
  }
  if (!Number.isSafeInteger(sides) || sides < 2) {
    throw new InvalidConfigurationError(
      'Dice sides must be an integer greater than or equal to 2.',
    );
  }
  return Object.freeze(
    Array.from({ length: count }, (_, index) =>
      Object.freeze({ id: `die-${index + 1}`, label: `D${sides}`, sides }),
    ),
  );
}

export function assertValidDiceSelection(
  dice: readonly DieDefinition[],
  selection: unknown,
): asserts selection is DiceSelection {
  if (typeof selection !== 'object' || selection === null || !('values' in selection)) {
    throw new InvalidResultError('A Dice selection must contain a values array.');
  }
  const { values, metadata } = selection as Partial<DiceSelection>;
  if (!Array.isArray(values) || values.length !== dice.length) {
    throw new InvalidResultError(`A Dice selection must contain exactly ${dice.length} values.`);
  }
  for (const [index, value] of values.entries()) {
    const die = dice[index] as DieDefinition;
    if (!Number.isSafeInteger(value) || value < 1 || value > die.sides) {
      throw new InvalidResultError(
        `Dice value ${index + 1} must be an integer from 1 through ${die.sides}.`,
      );
    }
  }
  if (metadata !== undefined && (typeof metadata !== 'object' || metadata === null)) {
    throw new InvalidResultError('Dice result metadata must be an object when supplied.');
  }
}
