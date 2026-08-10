import { GameStateError, InvalidSegmentError } from '@jackpotkit/core';
import { act, renderHook } from '@testing-library/react-native';

import { useSpinWheel } from './use-spin-wheel';

const segments = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
] as const;
const deterministicRandom = { next: () => 0.75 };

describe('useSpinWheel', () => {
  it('runs a deterministic random play through the shared lifecycle', async () => {
    const events: string[] = [];
    const onComplete = jest.fn();
    const { result } = await renderHook(() =>
      useSpinWheel({
        onComplete,
        onEvent: (event) => events.push(event.type),
        randomSource: deterministicRandom,
        segments,
      }),
    );

    let selectedId: string | undefined;
    await act(async () => {
      selectedId = (await result.current.spin()).segmentId;
    });

    expect(selectedId).toBe('two');
    expect(result.current.status).toBe('completed');
    expect(result.current.result?.segmentId).toBe('two');
    expect(onComplete).toHaveBeenCalledWith(result.current.result);
    expect(events).toEqual(['ready', 'play-start', 'result-resolved', 'complete']);
  });

  it('supports controlled and server-authoritative result modes', async () => {
    const controlled = await renderHook(() =>
      useSpinWheel({ result: { segmentId: 'one' }, segments }),
    );

    await act(async () => {
      await controlled.result.current.spin();
    });
    expect(controlled.result.current.result?.segmentId).toBe('one');

    const provider = jest.fn(async (campaignId: string) =>
      Promise.resolve({ segmentId: campaignId }),
    );
    const server = await renderHook(() =>
      useSpinWheel({ resultProvider: provider, resultRequest: 'two', segments }),
    );

    await act(async () => {
      await server.result.current.spin();
    });
    expect(provider).toHaveBeenCalledWith('two');
    expect(server.result.current.result?.segmentId).toBe('two');
  });

  it('reports disabled and unknown controlled results as typed errors', async () => {
    const onError = jest.fn();
    const disabled = await renderHook(() => useSpinWheel({ disabled: true, onError, segments }));
    let disabledError: unknown;

    await act(async () => {
      try {
        await disabled.result.current.spin();
      } catch (error) {
        disabledError = error;
      }
    });
    expect(disabledError).toBeInstanceOf(GameStateError);
    expect(onError).toHaveBeenCalledWith(expect.any(GameStateError));

    const controlled = await renderHook(() =>
      useSpinWheel({ result: { segmentId: 'missing' }, segments }),
    );
    let controlledError: unknown;
    await act(async () => {
      try {
        await controlled.result.current.spin();
      } catch (error) {
        controlledError = error;
      }
    });
    expect(controlledError).toBeInstanceOf(InvalidSegmentError);
  });

  it('clears the result and returns to ready on reset', async () => {
    const { result } = await renderHook(() => useSpinWheel({ segments }));

    await act(async () => {
      await result.current.spinTo('two');
    });
    await act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });
});
