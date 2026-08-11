import { InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import { createValidationResult, type ValidationResult } from '../validation/index.js';
import type {
  SlotMachineConfiguration,
  SlotMachineSelection,
  SlotPayline,
  SlotSymbol,
} from './types.js';

export function createDefaultSlotPaylines(
  reelCount: number,
  rowCount: number,
): readonly SlotPayline[] {
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

  return Object.freeze(
    Array.from({ length: rowCount }, (_, row) =>
      Object.freeze(Array.from({ length: reelCount }, () => row)),
    ),
  );
}

export function validateSlotSymbols(symbols: readonly SlotSymbol[]): ValidationResult {
  const issues: { code: string; message: string; path: readonly (string | number)[] }[] = [];
  const ids = new Set<string>();

  if (symbols.length === 0) {
    issues.push({
      code: 'empty-symbols',
      message: 'Add at least one slot symbol.',
      path: ['symbols'],
    });
  }

  symbols.forEach((symbol, index) => {
    if (typeof symbol.id !== 'string' || symbol.id.trim().length === 0) {
      issues.push({
        code: 'invalid-symbol-id',
        message: 'Every slot symbol needs a non-empty ID.',
        path: ['symbols', index, 'id'],
      });
    } else if (ids.has(symbol.id)) {
      issues.push({
        code: 'duplicate-symbol-id',
        message: `Slot symbol ID "${symbol.id}" is duplicated.`,
        path: ['symbols', index, 'id'],
      });
    }
    ids.add(symbol.id);

    const weight = symbol.weight ?? 1;
    if (!Number.isFinite(weight) || weight <= 0) {
      issues.push({
        code: 'invalid-symbol-weight',
        message: 'Slot symbol weights must be positive finite numbers.',
        path: ['symbols', index, 'weight'],
      });
    }
  });

  const totalWeight = symbols.reduce((total, symbol) => total + (symbol.weight ?? 1), 0);
  if (symbols.length > 0 && !Number.isFinite(totalWeight)) {
    issues.push({
      code: 'invalid-total-weight',
      message: 'The total slot symbol weight must be finite.',
      path: ['symbols'],
    });
  }

  return createValidationResult(issues);
}

export function validateSlotMachineConfiguration({
  reelCount,
  rowCount,
  paylines,
}: SlotMachineConfiguration): ValidationResult {
  const issues: { code: string; message: string; path: readonly (string | number)[] }[] = [];

  if (!Number.isInteger(reelCount) || reelCount <= 0) {
    issues.push({
      code: 'invalid-reel-count',
      message: 'reelCount must be a positive integer.',
      path: ['reelCount'],
    });
  }
  if (!Number.isInteger(rowCount) || rowCount <= 0) {
    issues.push({
      code: 'invalid-row-count',
      message: 'rowCount must be a positive integer.',
      path: ['rowCount'],
    });
  }

  const seen = new Set<string>();
  paylines.forEach((payline, index) => {
    if (payline.length !== reelCount) {
      issues.push({
        code: 'invalid-payline-length',
        message: 'Every payline must contain one row index per reel.',
        path: ['paylines', index],
      });
    }

    payline.forEach((row, reelIndex) => {
      if (!Number.isInteger(row) || row < 0 || row >= rowCount) {
        issues.push({
          code: 'invalid-payline-row',
          message: `Payline row indexes must be between 0 and ${Math.max(0, rowCount - 1)}.`,
          path: ['paylines', index, reelIndex],
        });
      }
    });

    const key = payline.join(',');
    if (seen.has(key)) {
      issues.push({
        code: 'duplicate-payline',
        message: 'Duplicate paylines are not allowed.',
        path: ['paylines', index],
      });
    }
    seen.add(key);
  });

  return createValidationResult(issues);
}

export function assertValidSlotMachineConfiguration(configuration: SlotMachineConfiguration): void {
  const validation = validateSlotMachineConfiguration(configuration);
  if (!validation.valid) {
    throw new InvalidConfigurationError(
      validation.issues[0]?.message ?? 'Invalid Slot Machine configuration.',
    );
  }
}

export function assertValidSlotSymbols(symbols: readonly SlotSymbol[]): void {
  const validation = validateSlotSymbols(symbols);
  if (!validation.valid) {
    throw new InvalidConfigurationError(validation.issues[0]?.message ?? 'Invalid slot symbols.');
  }
}

export function assertValidSlotMachineSelection(
  symbols: readonly SlotSymbol[],
  reelCount: number,
  rowCount: number,
  selection: unknown,
): asserts selection is SlotMachineSelection {
  if (selection === null || typeof selection !== 'object' || Array.isArray(selection)) {
    throw new InvalidResultError('A Slot Machine selection must be an object.');
  }

  const candidate = selection as { reels?: unknown; metadata?: unknown };
  if (!Array.isArray(candidate.reels) || candidate.reels.length !== reelCount) {
    throw new InvalidResultError('A Slot Machine selection must contain one grid column per reel.');
  }

  const symbolIds = new Set(symbols.map((symbol) => symbol.id));
  candidate.reels.forEach((reel, reelIndex) => {
    if (!Array.isArray(reel) || reel.length !== rowCount) {
      throw new InvalidResultError(`Slot Machine reel ${reelIndex} must contain ${rowCount} rows.`);
    }
    reel.forEach((symbolId) => {
      if (typeof symbolId !== 'string' || !symbolIds.has(symbolId)) {
        throw new InvalidResultError(`Unknown Slot Machine symbol ID "${String(symbolId)}".`);
      }
    });
  });

  if (
    candidate.metadata !== undefined &&
    (candidate.metadata === null ||
      typeof candidate.metadata !== 'object' ||
      Array.isArray(candidate.metadata))
  ) {
    throw new InvalidResultError('Slot Machine result metadata must be an object when supplied.');
  }
}
