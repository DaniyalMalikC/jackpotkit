import {
  AnimationError,
  GameStateError,
  ResultProviderError,
  SeededRandomSource,
  createSlotMachine,
  type SlotMachineResult,
} from '@jackpotkit/core';
import { SequenceRandomSource } from '@jackpotkit/testing';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  advance,
  createDeferred,
  createEventLog,
  flushMicrotasks,
  mockReducedMotionPreference,
} from '../__tests__/test-utils.js';
import { SlotMachine, type SlotMachineRef } from './index.js';

const SYMBOLS = [
  { id: 'cherry', label: 'Cherry' },
  { id: 'seven', label: 'Seven' },
  { id: 'bell', label: 'Bell' },
] as const;
const DURATION = 1_200;
const REEL_DELAY = 100;
// Three reels stop one delay apart, so the whole spin lasts the base duration plus two delays.
const TOTAL = DURATION + REEL_DELAY * 2;
const spinButton = () => screen.getByRole('button', { name: /^(PULL TO SPIN|SPINNING…)$/ });
const status = () => screen.getByRole('status').textContent;
const paylineText = (result: SlotMachineResult) =>
  `${result.winningPaylines.length} winning payline${result.winningPaylines.length === 1 ? '' : 's'}`;

function renderMachine(props: Partial<Parameters<typeof SlotMachine>[0]> = {}) {
  return render(
    <SlotMachine
      duration={DURATION}
      reelCount={3}
      reelDelay={REEL_DELAY}
      rowCount={1}
      symbols={SYMBOLS}
      {...props}
    />,
  );
}

describe('SlotMachine (web)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('spins a seeded random grid and completes after the last reel stops', async () => {
    const expected = createSlotMachine({
      randomSource: new SeededRandomSource('reels'),
      reelCount: 3,
      rowCount: 1,
      symbols: SYMBOLS,
    }).spin();
    const onComplete = vi.fn();
    const onReelStop = vi.fn<(reelIndex: number) => void>();
    renderMachine({
      onComplete,
      onReelStop,
      randomSource: new SeededRandomSource('reels'),
    });

    fireEvent.click(spinButton());
    await flushMicrotasks();
    expect(spinButton().textContent).toContain('SPINNING…');
    await advance(TOTAL - 1);
    expect(onComplete).not.toHaveBeenCalled();
    await advance(1);

    expect(onReelStop.mock.calls.map(([reelIndex]) => reelIndex)).toEqual([0, 1, 2]);
    expect(onComplete).toHaveBeenCalledOnce();
    const [result] = onComplete.mock.calls[0] as [SlotMachineResult];
    expect(result.game).toBe('slot-machine');
    expect(result.reels.map((reel) => reel.map((symbol) => symbol.id))).toEqual(
      expected.reels.map((reel) => reel.map((symbol) => symbol.id)),
    );
    expect(status()).toBe(paylineText(expected));
  });

  it('honours a controlled grid and emits reel stops between animation and reveal', async () => {
    const log = createEventLog();
    renderMachine({
      onEvent: log.onEvent,
      result: { reels: [['seven'], ['seven'], ['seven']] },
    });

    fireEvent.click(spinButton());
    await advance(TOTAL);
    expect(status()).toBe('1 winning payline');
    expect(log.types).toEqual([
      'ready',
      'play-start',
      'result-resolved',
      'animation-start',
      'reel-stop',
      'reel-stop',
      'reel-stop',
      'reveal-start',
      'complete',
    ]);
  });

  it('waits for a provider grid and recovers after a rejection', async () => {
    const first = createDeferred<{ readonly reels: readonly (readonly string[])[] }>();
    const onError = vi.fn();
    const onComplete = vi.fn();
    const resultProvider = vi
      .fn<() => Promise<{ readonly reels: readonly (readonly string[])[] }>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ reels: [['bell'], ['bell'], ['cherry']] });
    renderMachine({ onComplete, onError, resultProvider });

    fireEvent.click(spinButton());
    await flushMicrotasks();
    expect((spinButton() as HTMLButtonElement).disabled).toBe(true);
    expect(spinButton().getAttribute('aria-busy')).toBe('true');
    first.reject(new Error('timeout'));
    await flushMicrotasks();
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(ResultProviderError);
    expect(onComplete).not.toHaveBeenCalled();
    expect((spinButton() as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(spinButton());
    await flushMicrotasks();
    await advance(TOTAL);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(status()).toBe('0 winning paylines');
  });

  // Regression: a rapid second click resolved a second random grid. The reels showed the first
  // grid and onComplete reported it, while the status text counted paylines on the second grid.
  it('ignores a rapid second spin', async () => {
    const onComplete = vi.fn();
    const onResultResolved = vi.fn();
    renderMachine({
      onComplete,
      onResultResolved,
      randomSource: new SequenceRandomSource([0, 0, 0, 0.5, 0.9, 0.1]),
    });

    fireEvent.click(spinButton());
    fireEvent.click(spinButton());
    await advance(TOTAL);

    expect(onResultResolved).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledOnce();
    const [result] = onComplete.mock.calls[0] as [SlotMachineResult];
    expect(status()).toBe(paylineText(result));
  });

  it('cancels on reset without emitting reel stops or completion', async () => {
    const reference = createRef<SlotMachineRef>();
    const onComplete = vi.fn();
    const onReelStop = vi.fn();
    renderMachine({
      onComplete,
      onReelStop,
      ref: reference,
      result: { reels: [['seven'], ['seven'], ['seven']] },
    });

    let settled: Promise<unknown> = Promise.resolve();
    await act(async () => {
      settled = (reference.current?.spin() ?? Promise.resolve()).catch((error: unknown) => error);
      await Promise.resolve();
    });
    act(() => reference.current?.reset());
    await advance(TOTAL);

    await expect(settled).resolves.toBeInstanceOf(AnimationError);
    expect(onReelStop).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(status()).toBe('');
    expect(spinButton().textContent).toContain('PULL TO SPIN');
  });

  it('keeps a disabled machine idle and rejects imperative spins', async () => {
    const reference = createRef<SlotMachineRef>();
    renderMachine({ disabled: true, ref: reference });

    expect((spinButton() as HTMLButtonElement).disabled).toBe(true);
    expect(spinButton().getAttribute('aria-busy')).toBe('false');
    expect(spinButton().textContent).toContain('PULL TO SPIN');
    await expect(reference.current?.spin()).rejects.toBeInstanceOf(GameStateError);
  });

  it('drops the reel stagger and uses the short duration under reduced motion', async () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation);
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: animate,
      writable: true,
    });
    const restore = mockReducedMotionPreference(true);
    try {
      const onComplete = vi.fn();
      renderMachine({ onComplete, result: { reels: [['bell'], ['bell'], ['bell']] } });
      await flushMicrotasks();
      fireEvent.click(spinButton());
      await flushMicrotasks();

      expect(animate).toHaveBeenCalledTimes(3);
      for (const call of animate.mock.calls as unknown as [unknown, KeyframeAnimationOptions][]) {
        expect(call[1]).toMatchObject({ delay: 0, duration: 160 });
      }
      await advance(160);
      expect(onComplete).toHaveBeenCalledOnce();
    } finally {
      restore();
      Reflect.deleteProperty(HTMLElement.prototype, 'animate');
    }
  });

  it('exposes a focusable native button for keyboard activation', () => {
    renderMachine();
    const button = spinButton();
    expect(button.tagName).toBe('BUTTON');
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});
