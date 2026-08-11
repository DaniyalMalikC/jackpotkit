import { describe, expect, it } from 'vitest';

import { GameStateError, InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import { createLuckyBox } from './create-lucky-box.js';

const boxes = [
  { id: 'one', reward: { points: 10 } },
  { id: 'two', reward: { points: 20 } },
  { id: 'disabled', disabled: true },
];

describe('Lucky Box engine', () => {
  it('tracks selected and revealed state for a random winning box', () => {
    const game = createLuckyBox({ boxes, randomSource: { next: () => 0 } });
    expect(game.select('one')).toEqual({
      revealed: false,
      selectedBoxId: 'one',
      status: 'playing',
    });
    expect(game.reveal()).toMatchObject({
      data: { selectedBoxId: 'one', winningBoxId: 'one', won: true },
      reward: { points: 10 },
      won: true,
    });
    expect(game.state.revealed).toBe(true);
    expect(game.reset()).toMatchObject({ selectedBoxId: undefined, status: 'ready' });
  });

  it('supports controlled losses and server-controlled winners', async () => {
    const game = createLuckyBox({ boxes });
    game.select('one');
    expect(game.revealTo({ boxId: 'two' })).toMatchObject({ won: false });
    game.reset();
    game.select('two');
    const result = await game.revealWith(
      async () => ({ boxId: 'two', metadata: { authority: 'server' } }),
      undefined,
    );
    expect(result).toMatchObject({ won: true, reward: { points: 20 } });
    expect(result.metadata).toEqual({ authority: 'server' });
  });

  it('validates boxes, selections, and lifecycle state', () => {
    expect(() => createLuckyBox({ boxes: [] })).toThrow(InvalidConfigurationError);
    expect(() => createLuckyBox({ boxes: [{ id: 'same' }, { id: 'same' }] })).toThrow(
      'duplicate box ID',
    );
    expect(() => createLuckyBox({ boxes: [{ id: 'off', disabled: true }] })).toThrow(
      'one enabled box',
    );
    const game = createLuckyBox({ boxes });
    expect(() => game.reveal()).toThrow('Select a Lucky Box');
    expect(() => game.select('disabled')).toThrow(GameStateError);
    expect(() => game.select('missing')).toThrow(InvalidResultError);
  });

  it('invalidates provider results after reset', async () => {
    let resolveSelection: ((selection: { boxId: string }) => void) | undefined;
    const game = createLuckyBox({ boxes });
    game.select('one');
    const pending = game.revealWith(
      () => new Promise((resolve) => (resolveSelection = resolve)),
      undefined,
    );
    game.reset();
    resolveSelection?.({ boxId: 'one' });
    await expect(pending).rejects.toThrow(GameStateError);
  });
});
