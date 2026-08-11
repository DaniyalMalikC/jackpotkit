import { GameStateError } from '@jackpotkit/core';
import { act, renderHook } from '@testing-library/react-native';

import { useSlotMachine } from './use-slot-machine';

const symbols = [{ id: 'cherry' }, { id: 'star' }];
const selection = {
  reels: [
    ['star', 'cherry'],
    ['star', 'cherry'],
    ['star', 'cherry'],
  ],
};

describe('useSlotMachine', () => {
  it('resolves controlled results and completes the headless lifecycle', async () => {
    const events: string[] = [];
    const onComplete = jest.fn();
    const { result } = await renderHook(() =>
      useSlotMachine({
        onComplete,
        onEvent: (event) => events.push(event.type),
        reelCount: 3,
        result: selection,
        rowCount: 2,
        symbols,
      }),
    );

    await act(async () => {
      await result.current.spin();
    });
    expect(result.current.result?.data.reels).toEqual(selection.reels);
    expect(result.current.status).toBe('completed');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(events).toEqual(['ready', 'play-start', 'result-resolved', 'complete']);
  });

  it('supports async server destinations and custom evaluation', async () => {
    const provider = jest.fn(async () => selection);
    const { result } = await renderHook(() =>
      useSlotMachine({
        evaluate: ({ winningPaylines }) => winningPaylines.length,
        reelCount: 3,
        resultProvider: provider,
        rowCount: 2,
        symbols,
      }),
    );

    await act(async () => {
      await result.current.spin();
    });
    expect(provider).toHaveBeenCalledTimes(1);
    expect(result.current.result?.evaluation).toBe(2);
  });

  it('supports explicit destinations and reset', async () => {
    const { result } = await renderHook(() =>
      useSlotMachine({ reelCount: 3, rowCount: 2, symbols }),
    );
    await act(async () => {
      await result.current.spinTo(selection);
    });
    await act(() => result.current.reset());
    expect(result.current.result).toBeUndefined();
    expect(result.current.status).toBe('ready');
  });

  it('reports disabled play through a typed error', async () => {
    const onError = jest.fn();
    const { result } = await renderHook(() =>
      useSlotMachine({ disabled: true, onError, reelCount: 3, symbols }),
    );
    await act(async () => {
      await expect(result.current.spin()).rejects.toThrow(GameStateError);
    });
    expect(onError).toHaveBeenCalledWith(expect.any(GameStateError));
  });
});
