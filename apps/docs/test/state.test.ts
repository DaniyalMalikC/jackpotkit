import { describe, expect, it } from 'vitest';

import { gameIds } from '@/lib/games';
import { playgroundSchemas } from '@/lib/playground/games';
import { toLoggable, toSource } from '@/lib/playground/serialize';
import {
  initialState,
  normalizeOutcome,
  selectionFor,
  supportedModes,
} from '@/lib/playground/state';

describe('playground schemas', () => {
  it('give every game at least one result mode and unique control props', () => {
    for (const game of gameIds) {
      const schema = playgroundSchemas[game];
      expect(schema.game).toBe(game);
      expect(supportedModes(schema).length).toBeGreaterThan(0);
      const props = schema.controls.map((control) => control.prop);
      expect(new Set(props).size).toBe(props.length);
      expect(schema.events).toContain('onComplete');
      expect(schema.events).toContain('onError');
    }
  });

  it('have an outcome editor whenever controlled or provider mode exists', () => {
    for (const game of gameIds) {
      const schema = playgroundSchemas[game];
      if (schema.modes.controlled || schema.modes.provider) expect(schema.outcome).toBeDefined();
    }
  });
});

describe('normalizeOutcome', () => {
  it('falls back to the first segment when the chosen one is removed', () => {
    const schema = playgroundSchemas['spin-wheel'];
    const segments = [{ id: 'a' }, { id: 'b' }];
    expect(normalizeOutcome(schema, { segments }, 'b')).toBe('b');
    expect(normalizeOutcome(schema, { segments }, 'missing')).toBe('a');
  });

  it('resizes the slot grid and dice values to the current configuration', () => {
    const slot = playgroundSchemas['slot-machine'];
    const values = { ...initialState(slot).values, reelCount: 2, rowCount: 1 };
    expect(normalizeOutcome(slot, values, [['star', 'gift'], ['bell'], ['cherry']])).toEqual([
      ['star'],
      ['bell'],
    ]);
    const dice = playgroundSchemas.dice;
    expect(normalizeOutcome(dice, { count: 3, sides: 4 }, [9, 2])).toEqual([4, 2, 4]);
    expect(selectionFor(dice, [1, 2])).toEqual({ values: [1, 2] });
  });
});

describe('serialization', () => {
  it('prints values as TypeScript literals', () => {
    expect(toSource({ id: 'a', 'data-x': "it's", list: [1, true] })).toBe(
      "{ id: 'a', 'data-x': 'it\\'s', list: [1, true] }",
    );
  });

  it('keeps error details and survives cycles in the event log', () => {
    const cyclic: Record<string, unknown> = { name: 'loop' };
    cyclic.self = cyclic;
    expect(toLoggable(new RangeError('bad size'))).toEqual({
      message: 'bad size',
      name: 'RangeError',
    });
    expect(toLoggable(new Error('outer', { cause: new Error('inner') }))).toEqual({
      cause: { message: 'inner', name: 'Error' },
      message: 'outer',
      name: 'Error',
    });
    expect(toLoggable(cyclic)).toEqual({ name: 'loop', self: '[Circular]' });
    expect(toLoggable(() => undefined)).toBe('[Function anonymous]');
  });
});
