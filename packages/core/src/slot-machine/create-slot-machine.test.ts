import { describe, expect, it } from 'vitest';

import { GameStateError, InvalidResultError } from '../errors/index.js';
import { createSlotMachine } from './create-slot-machine.js';

const symbols = [
  { id: 'cherry', label: 'Cherry', value: 1 },
  { id: 'star', label: 'Star', value: 2 },
];
const win = {
  reels: [
    ['star', 'cherry'],
    ['star', 'cherry'],
    ['star', 'cherry'],
  ],
};

describe('Slot Machine engine', () => {
  it('resolves controlled grids, paylines and custom evaluation', () => {
    const machine = createSlotMachine({
      evaluate: ({ winningPaylines }) => ({ matches: winningPaylines.length }),
      now: () => 42,
      reelCount: 3,
      rowCount: 2,
      symbols,
    });

    const result = machine.spinTo(win);
    expect(result.id).toBe('slot-machine-1');
    expect(result.data.reels).toEqual(win.reels);
    expect(result.winningPaylines.map((payline) => payline.index)).toEqual([0, 1]);
    expect(result.evaluation).toEqual({ matches: 2 });
    expect(machine.status).toBe('completed');
  });

  it('supports weighted deterministic random results', () => {
    const values = [0, 0.99];
    let index = 0;
    const machine = createSlotMachine({
      randomSource: { next: () => values[index++ % values.length] as number },
      reelCount: 2,
      rowCount: 1,
      symbols: [
        { id: 'common', weight: 9 },
        { id: 'rare', weight: 1 },
      ],
    });

    expect(machine.spin().data.reels).toEqual([['common'], ['rare']]);
  });

  it('supports provider results and preserves metadata', async () => {
    const machine = createSlotMachine({ reelCount: 3, rowCount: 2, symbols });
    await expect(
      machine.spinWith(async () => ({ ...win, metadata: { authority: 'server' } }), undefined),
    ).resolves.toMatchObject({ metadata: { authority: 'server' } });
  });

  it('rejects invalid destinations', () => {
    const machine = createSlotMachine({ reelCount: 3, rowCount: 2, symbols });
    expect(() => machine.spinTo({ reels: [['missing']] })).toThrow(InvalidResultError);
    expect(machine.status).toBe('error');
  });

  it('invalidates a provider result after reset', async () => {
    let resolveSelection: ((selection: typeof win) => void) | undefined;
    const machine = createSlotMachine({ reelCount: 3, rowCount: 2, symbols });
    const pending = machine.spinWith(
      () =>
        new Promise((resolve) => {
          resolveSelection = resolve;
        }),
      undefined,
    );

    machine.reset();
    resolveSelection?.(win);
    await expect(pending).rejects.toThrow(GameStateError);
    expect(machine.status).toBe('ready');
    expect(machine.result).toBeUndefined();
  });
});
