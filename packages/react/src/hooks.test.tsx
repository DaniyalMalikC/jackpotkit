import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useBingo } from './bingo/index.js';
import { useCoinFlip } from './coin-flip/index.js';
import { useDice } from './dice/index.js';
import { useLuckyBox } from './lucky-box/index.js';
import { useScratchCard } from './scratch-card/index.js';
import { useSlotMachine } from './slot-machine/index.js';
import { useSpinWheel } from './spin-wheel/index.js';

const LUCKY_BOXES = [{ id: 'chosen' }, { id: 'winner' }] as const;
const BINGO_BOARD = [
  [1, 2, 3],
  [4, 'free', 5],
  [6, 7, 8],
] as const;
const BINGO_PATTERNS = ['row'] as const;

describe('React web hooks', () => {
  it('uses a provider result and emits the Dice lifecycle', async () => {
    const onComplete = vi.fn();
    const resultProvider = vi.fn(async () => ({ values: [4, 5] }));
    const { result } = renderHook(() => useDice({ count: 2, onComplete, resultProvider }));
    await act(() => result.current.roll());
    expect(resultProvider).toHaveBeenCalledOnce();
    expect(result.current.result?.total).toBe(9);
    expect(result.current.status).toBe('completed');
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('keeps controlled results aligned across one-shot games', async () => {
    const wheel = renderHook(() =>
      useSpinWheel({
        result: { segmentId: 'two' },
        segments: [{ id: 'one' }, { id: 'two' }],
      }),
    );
    await act(() => wheel.result.current.spin());
    expect(wheel.result.current.result?.segmentId).toBe('two');

    const coin = renderHook(() => useCoinFlip({ result: { faceId: 'tails' } }));
    await act(() => coin.result.current.flip());
    expect(coin.result.current.result?.faceId).toBe('tails');

    const slot = renderHook(() =>
      useSlotMachine({
        reelCount: 2,
        result: { reels: [['star'], ['star']] },
        rowCount: 1,
        symbols: [{ id: 'star' }, { id: 'gift' }],
      }),
    );
    await act(() => slot.result.current.spin());
    expect(slot.result.current.result?.winningPaylines).toHaveLength(1);
  });

  it('keeps Lucky Box selection separate from the winning box', async () => {
    const { result } = renderHook(() =>
      useLuckyBox({
        boxes: LUCKY_BOXES,
        result: { boxId: 'winner' },
      }),
    );
    act(() => result.current.select('chosen'));
    await act(() => result.current.reveal());
    expect(result.current.result?.won).toBe(false);
    expect(result.current.result?.winningBox.id).toBe('winner');
  });

  it('tracks Scratch Card progress and reset', () => {
    const { result } = renderHook(() =>
      useScratchCard({ result: { prize: 'bonus' }, threshold: 0.5 }),
    );
    act(() => result.current.scratch(0.6));
    expect(result.current.result?.prize).toBe('bonus');
    expect(result.current.status).toBe('completed');
    act(() => result.current.reset());
    expect(result.current.progress).toBe(0);
    expect(result.current.result).toBeUndefined();
  });

  it('retains Bingo calls and marks as persistent hook state', () => {
    const { result } = renderHook(() =>
      useBingo({
        board: BINGO_BOARD,
        maxNumber: 9,
        patterns: BINGO_PATTERNS,
        size: 3,
      }),
    );
    act(() => {
      result.current.call(1);
      result.current.mark(1);
    });
    expect(result.current.state.calledNumbers).toContain(1);
    expect(result.current.state.markedNumbers).toContain(1);
  });
});
