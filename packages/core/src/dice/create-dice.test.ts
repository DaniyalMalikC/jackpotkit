import { describe, expect, it } from 'vitest';

import { GameStateError, InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import { createDice } from './create-dice.js';

describe('Dice engine', () => {
  it('rolls one or many standard and custom-sided dice deterministically', () => {
    const values = [0, 0.999];
    const dice = createDice({
      dice: [
        { id: 'd4', sides: 4 },
        { id: 'd20', sides: 20 },
      ],
      randomSource: { next: () => values.shift() as number },
      now: () => 50,
    });

    expect(dice.roll()).toMatchObject({
      data: { total: 21, values: [1, 20] },
      game: 'dice',
      timestamp: 50,
      total: 21,
      values: [1, 20],
    });
  });

  it('accepts controlled and provider results', async () => {
    const dice = createDice({ count: 2, sides: 8 });
    expect(dice.rollTo({ values: [3, 7] }).total).toBe(10);
    expect(await dice.rollWith(async () => ({ values: [8, 8] }), undefined)).toMatchObject({
      total: 16,
    });
  });

  it('validates definitions and exact result dimensions', () => {
    expect(() => createDice({ count: 0 })).toThrow(InvalidConfigurationError);
    expect(() => createDice({ dice: [{ id: 'bad', sides: 1 }] })).toThrow('at least 2');
    expect(() =>
      createDice({
        dice: [
          { id: 'same', sides: 6 },
          { id: 'same', sides: 6 },
        ],
      }),
    ).toThrow('duplicate die ID');
    expect(() => createDice({ count: 1, dice: [{ id: 'd6', sides: 6 }] })).toThrow(
      'either dice definitions',
    );
    expect(() => createDice({ count: 2 }).rollTo({ values: [6] })).toThrow(InvalidResultError);
    expect(() => createDice({ sides: 4 }).rollTo({ values: [5] })).toThrow('from 1 through 4');
  });

  it('invalidates provider results after reset', async () => {
    let resolveSelection: ((selection: { values: number[] }) => void) | undefined;
    const dice = createDice();
    const pending = dice.rollWith(
      () => new Promise((resolve) => (resolveSelection = resolve)),
      undefined,
    );
    dice.reset();
    resolveSelection?.({ values: [4] });

    await expect(pending).rejects.toThrow(GameStateError);
    expect(dice.status).toBe('ready');
  });
});
