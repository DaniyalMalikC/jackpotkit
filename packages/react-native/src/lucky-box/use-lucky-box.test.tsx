import { GameStateError } from '@jackpotkit/core';
import { act, renderHook } from '@testing-library/react-native';

import { useLuckyBox } from './use-lucky-box';

const boxes = [{ id: 'one', reward: 'badge' }, { id: 'two' }] as const;

describe('useLuckyBox', () => {
  it('keeps the selected and controlled winning boxes independent', async () => {
    const onSelect = jest.fn();
    const { result } = await renderHook(() =>
      useLuckyBox({ boxes, onSelect, result: { boxId: 'two' } }),
    );
    await act(async () => result.current.select('one'));
    expect(result.current.selectedBoxId).toBe('one');
    await act(async () => {
      await result.current.reveal();
    });
    expect(result.current.result).toMatchObject({ won: false, winningBox: { id: 'two' } });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'one' }));
  });

  it('supports provider picks, reset, and required selection', async () => {
    const provider = jest.fn(async () => ({ boxId: 'one' }));
    const { result } = await renderHook(() => useLuckyBox({ boxes, resultProvider: provider }));
    await act(async () => {
      await result.current.pick('one');
    });
    expect(result.current.result).toMatchObject({ reward: 'badge', won: true });
    await act(async () => result.current.reset());
    await act(async () => {
      await expect(result.current.reveal()).rejects.toThrow(GameStateError);
    });
  });
});
