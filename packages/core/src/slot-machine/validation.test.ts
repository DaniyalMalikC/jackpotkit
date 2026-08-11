import { describe, expect, it } from 'vitest';

import { InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import {
  assertValidSlotMachineConfiguration,
  assertValidSlotMachineSelection,
  assertValidSlotSymbols,
  createDefaultSlotPaylines,
  validateSlotMachineConfiguration,
  validateSlotSymbols,
} from './validation.js';

const symbols = [{ id: 'cherry' }, { id: 'star', weight: 2 }];

describe('Slot Machine validation', () => {
  it('creates straight default paylines', () => {
    expect(createDefaultSlotPaylines(3, 2)).toEqual([
      [0, 0, 0],
      [1, 1, 1],
    ]);
    expect(() => createDefaultSlotPaylines(0, 2)).toThrow(InvalidConfigurationError);
  });

  it('validates symbol IDs and weights', () => {
    expect(validateSlotSymbols(symbols)).toEqual({ valid: true, issues: [] });
    expect(validateSlotSymbols([]).valid).toBe(false);
    expect(validateSlotSymbols([{ id: '' }]).valid).toBe(false);
    expect(validateSlotSymbols([{ id: 'x' }, { id: 'x' }]).valid).toBe(false);
    expect(validateSlotSymbols([{ id: 'x', weight: 0 }]).valid).toBe(false);
    expect(() => assertValidSlotSymbols([])).toThrow(InvalidConfigurationError);
  });

  it('validates dimensions and paylines', () => {
    expect(
      validateSlotMachineConfiguration({
        paylines: [[0, 1, 0]],
        reelCount: 3,
        rowCount: 2,
      }),
    ).toEqual({ valid: true, issues: [] });

    expect(() =>
      assertValidSlotMachineConfiguration({ paylines: [[0, 0]], reelCount: 3, rowCount: 2 }),
    ).toThrow(InvalidConfigurationError);
    expect(
      validateSlotMachineConfiguration({
        paylines: [
          [0, 0, 0],
          [0, 0, 0],
        ],
        reelCount: 3,
        rowCount: 2,
      }).valid,
    ).toBe(false);
  });

  it('rejects malformed controlled grids and unknown symbols', () => {
    expect(() =>
      assertValidSlotMachineSelection(symbols, 2, 2, {
        reels: [
          ['cherry', 'star'],
          ['star', 'cherry'],
        ],
      }),
    ).not.toThrow();
    expect(() =>
      assertValidSlotMachineSelection(symbols, 2, 2, { reels: [['cherry', 'star']] }),
    ).toThrow(InvalidResultError);
    expect(() =>
      assertValidSlotMachineSelection(symbols, 2, 2, {
        reels: [
          ['cherry', 'missing'],
          ['star', 'cherry'],
        ],
      }),
    ).toThrow(InvalidResultError);
  });
});
