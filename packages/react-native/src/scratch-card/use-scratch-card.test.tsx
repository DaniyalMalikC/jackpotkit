import { GameStateError } from '@jackpotkit/core';
import { act, renderHook } from '@testing-library/react-native';

import { useScratchCard } from './use-scratch-card';

describe('useScratchCard', () => {
  it('tracks controlled progress and completes only once per cycle', async () => {
    const events: string[] = [];
    const onComplete = jest.fn();
    const onProgress = jest.fn();
    const { result } = await renderHook(() =>
      useScratchCard({
        onComplete,
        onEvent: (event) => events.push(event.type),
        onProgress,
        result: { prize: 'coupon' },
        threshold: 0.6,
      }),
    );

    await act(() => {
      result.current.scratch(0.3);
      result.current.scratch(0.7);
      result.current.scratch(0.9);
    });

    expect(result.current.progress).toBe(0.9);
    expect(result.current.result?.prize).toBe('coupon');
    expect(result.current.status).toBe('completed');
    expect(onProgress).toHaveBeenLastCalledWith(0.9);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      'ready',
      'play-start',
      'result-resolved',
      'progress',
      'progress',
      'complete',
      'progress',
    ]);
  });

  it('supports server-authoritative results while progress accumulates', async () => {
    let resolveSelection: ((value: { prize: string }) => void) | undefined;
    const provider = jest.fn(
      () =>
        new Promise<{ prize: string }>((resolve) => {
          resolveSelection = resolve;
        }),
    );
    const onComplete = jest.fn();
    const { result } = await renderHook(() =>
      useScratchCard({ onComplete, resultProvider: provider, threshold: 0.5 }),
    );

    await act(() => {
      result.current.scratch(0.8);
    });
    expect(result.current.status).toBe('requesting-result');
    expect(onComplete).not.toHaveBeenCalled();

    await act(async () => {
      resolveSelection?.({ prize: 'server-prize' });
      await Promise.resolve();
    });

    expect(result.current.result?.prize).toBe('server-prize');
    expect(result.current.status).toBe('completed');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('supports accessible-style reveal and reset', async () => {
    const { result } = await renderHook(() =>
      useScratchCard({ result: { prize: { id: 'badge' } } }),
    );

    await act(async () => {
      await result.current.reveal();
    });
    expect(result.current.progress).toBe(1);
    expect(result.current.status).toBe('completed');

    await act(() => result.current.reset());
    expect(result.current.progress).toBe(0);
    expect(result.current.result).toBeUndefined();
    expect(result.current.status).toBe('ready');
  });

  it('reports disabled interaction as a typed error', async () => {
    const onError = jest.fn();
    const { result } = await renderHook(() => useScratchCard({ disabled: true, onError }));

    await act(() => {
      expect(() => result.current.scratch(0.2)).toThrow(GameStateError);
    });
    expect(onError).toHaveBeenCalledWith(expect.any(GameStateError));
  });
});
