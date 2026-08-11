import { GameStateError } from '@jackpotkit/core';
import { act, renderHook } from '@testing-library/react-native';

import { useBingo } from './use-bingo';

const board = [
  [1, 4, 7],
  [2, 'free', 8],
  [3, 6, 9],
] as const;

describe('useBingo', () => {
  it('exposes persistent calling, marking, completion, and reset state', async () => {
    const events: string[] = [];
    const onComplete = jest.fn();
    const { result } = await renderHook(() =>
      useBingo({
        board,
        maxNumber: 9,
        onComplete,
        onEvent: (event) => events.push(event.type),
        size: 3,
      }),
    );

    await act(async () => {
      for (const number of [1, 4, 7]) {
        result.current.call(number);
        result.current.mark(number);
      }
    });

    expect(result.current.status).toBe('completed');
    expect(result.current.result?.matches.map(({ id }) => id)).toContain('row-1');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      'ready',
      'number-call',
      'mark',
      'number-call',
      'mark',
      'number-call',
      'complete',
      'mark',
    ]);

    await act(async () => result.current.reset());
    expect(result.current.status).toBe('ready');
    expect(result.current.state.calledNumbers).toEqual([]);
  });

  it('draws, toggles marks, and preserves immutable snapshots', async () => {
    const randomSource = { next: jest.fn(() => 0) };
    const { result } = await renderHook(() =>
      useBingo({ board, maxNumber: 9, randomSource, size: 3 }),
    );

    await act(async () => expect(result.current.draw()).toBe(1));
    const calledState = result.current.state;
    await act(async () => result.current.toggleMark(1));
    expect(result.current.state.markedNumbers).toEqual([1]);
    expect(result.current.state).not.toBe(calledState);
    await act(async () => result.current.toggleMark(1));
    expect(result.current.state.markedNumbers).toEqual([]);
  });

  it('reports disabled actions through typed errors', async () => {
    const onError = jest.fn();
    const { result } = await renderHook(() =>
      useBingo({ board, disabled: true, maxNumber: 9, onError, size: 3 }),
    );

    await act(async () => expect(() => result.current.call(1)).toThrow(GameStateError));
    expect(result.current.status).toBe('disabled');
    expect(onError).toHaveBeenCalledWith(expect.any(GameStateError));
  });

  it('reports recoverable engine failures as error status', async () => {
    const { result } = await renderHook(() => useBingo({ board, maxNumber: 9, size: 3 }));

    await act(async () => expect(() => result.current.mark(1)).toThrow(GameStateError));
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeInstanceOf(GameStateError);

    await act(async () => result.current.call(1));
    expect(result.current.status).toBe('playing');
    expect(result.current.error).toBeUndefined();
  });
});
