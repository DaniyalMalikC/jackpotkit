import { act, renderHook } from '@testing-library/react-native';

import { useCoinFlip } from './use-coin-flip';

describe('useCoinFlip', () => {
  it('completes controlled flips and exposes the selected face', async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() =>
      useCoinFlip({ onComplete, result: { faceId: 'tails' } }),
    );
    await act(async () => {
      await result.current.flip();
    });
    expect(result.current.result?.faceId).toBe('tails');
    expect(result.current.status).toBe('completed');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('supports custom provider faces and reset', async () => {
    const faces = [
      { id: 'yes', value: true },
      { id: 'no', value: false },
    ] as const;
    const provider = jest.fn(async () => ({ faceId: 'yes' }));
    const { result } = await renderHook(() => useCoinFlip({ faces, resultProvider: provider }));
    await act(async () => {
      await result.current.flip();
    });
    expect(result.current.result?.face.value).toBe(true);
    await act(async () => result.current.reset());
    await act(async () => {
      await result.current.flipTo({ faceId: 'no' });
    });
    expect(result.current.result?.face.value).toBe(false);
  });
});
