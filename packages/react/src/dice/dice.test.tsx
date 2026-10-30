import {
  AnimationError,
  GameStateError,
  ResultProviderError,
  SeededRandomSource,
  createDice,
  type DiceResult,
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
import { Dice, type DiceRef } from './index.js';

const DURATION = 700;
const rollButton = () => screen.getByRole('button', { name: /Roll/ });
const status = () => screen.getByRole('status').textContent;
const faceValues = () =>
  screen
    .getAllByLabelText(/^D6: \d+$/)
    .map((face) => Number(face.getAttribute('aria-label')?.slice('D6: '.length)));

describe('Dice (web)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rolls random values from a seeded source and reports the payload once', async () => {
    const expected = createDice({ count: 2, randomSource: new SeededRandomSource(42) }).roll();
    const onComplete = vi.fn();
    render(
      <Dice
        count={2}
        duration={DURATION}
        onComplete={onComplete}
        randomSource={new SeededRandomSource(42)}
      />,
    );

    fireEvent.click(rollButton());
    await flushMicrotasks();
    expect(rollButton().textContent).toBe('Rolling…');
    expect(onComplete).not.toHaveBeenCalled();

    await advance(DURATION);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0]?.[0]).toMatchObject({
      game: 'dice',
      total: expected.total,
      values: expected.values,
    });
    expect(status()).toBe(`Total: ${expected.total}`);
    expect(faceValues()).toEqual(expected.values);
  });

  it('honours controlled results and imperative rollTo selections', async () => {
    const reference = createRef<DiceRef>();
    const log = createEventLog();
    render(
      <Dice
        count={2}
        duration={DURATION}
        onEvent={log.onEvent}
        ref={reference}
        result={{ values: [2, 3] }}
      />,
    );

    fireEvent.click(rollButton());
    await advance(DURATION);
    expect(status()).toBe('Total: 5');
    expect(log.types).toEqual([
      'ready',
      'play-start',
      'result-resolved',
      'animation-start',
      'reveal-start',
      'complete',
    ]);

    let rolled: Promise<DiceResult> | undefined;
    await act(async () => {
      rolled = reference.current?.rollTo({ values: [6, 6] });
      await vi.advanceTimersByTimeAsync(DURATION);
    });
    await expect(rolled).resolves.toMatchObject({ total: 12, values: [6, 6] });
    expect(status()).toBe('Total: 12');
  });

  it('waits for a provider result and surfaces provider rejection as an error', async () => {
    const deferred = createDeferred<{ readonly values: readonly number[] }>();
    const onError = vi.fn();
    const onComplete = vi.fn();
    const resultProvider = vi.fn(() => deferred.promise);
    render(
      <Dice
        duration={DURATION}
        onComplete={onComplete}
        onError={onError}
        resultProvider={resultProvider}
      />,
    );

    fireEvent.click(rollButton());
    await flushMicrotasks();
    expect(resultProvider).toHaveBeenCalledOnce();
    expect((rollButton() as HTMLButtonElement).disabled).toBe(true);
    expect(rollButton().getAttribute('aria-busy')).toBe('true');

    const failure = new Error('server unavailable');
    deferred.reject(failure);
    await flushMicrotasks();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(ResultProviderError);
    expect(onComplete).not.toHaveBeenCalled();
    expect((rollButton() as HTMLButtonElement).disabled).toBe(false);
    expect(status()).toBe('');
  });

  // Regression: see the Spin Wheel equivalent. The second click resolved another random roll that
  // replaced the displayed dice while onComplete still reported the first roll.
  it('ignores a rapid second roll and keeps onComplete aligned with the visible dice', async () => {
    const onComplete = vi.fn();
    const onResultResolved = vi.fn();
    render(
      <Dice
        duration={DURATION}
        onComplete={onComplete}
        onResultResolved={onResultResolved}
        randomSource={new SequenceRandomSource([0, 0.99])}
      />,
    );

    fireEvent.click(rollButton());
    fireEvent.click(rollButton());
    await advance(DURATION);

    expect(onResultResolved).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledOnce();
    const [result] = onComplete.mock.calls[0] as [DiceResult];
    expect(status()).toBe(`Total: ${result.total}`);
    expect(faceValues()).toEqual(result.values);
  });

  it('cancels the roll on reset and returns the dice to their initial faces', async () => {
    const reference = createRef<DiceRef>();
    const onComplete = vi.fn();
    render(
      <Dice duration={DURATION} onComplete={onComplete} ref={reference} result={{ values: [4] }} />,
    );

    let settled: Promise<unknown> = Promise.resolve();
    await act(async () => {
      settled = (reference.current?.roll() ?? Promise.resolve()).catch((error: unknown) => error);
      await Promise.resolve();
    });
    expect(faceValues()).toEqual([4]);
    act(() => reference.current?.reset());
    await advance(DURATION);

    await expect(settled).resolves.toBeInstanceOf(AnimationError);
    expect(onComplete).not.toHaveBeenCalled();
    expect(faceValues()).toEqual([1]);
    expect(rollButton().textContent).toBe('Roll dice');
  });

  it('keeps disabled dice idle and rejects imperative rolls', async () => {
    const reference = createRef<DiceRef>();
    render(<Dice disabled ref={reference} />);

    expect((rollButton() as HTMLButtonElement).disabled).toBe(true);
    expect(rollButton().getAttribute('aria-busy')).toBe('false');
    expect(rollButton().textContent).toBe('Roll dice');
    await expect(reference.current?.roll()).rejects.toBeInstanceOf(GameStateError);
  });

  it('skips the Web Animations tumble and shortens the roll under reduced motion', async () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation);
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: animate,
      writable: true,
    });
    const restore = mockReducedMotionPreference(true);
    try {
      const onComplete = vi.fn();
      render(<Dice duration={DURATION} onComplete={onComplete} result={{ values: [3] }} />);
      await flushMicrotasks();
      fireEvent.click(rollButton());
      await advance(160);
      expect(onComplete).toHaveBeenCalledOnce();
      expect(animate).not.toHaveBeenCalled();
      cleanup();

      render(<Dice duration={DURATION} reduceMotion={false} result={{ values: [3] }} />);
      fireEvent.click(rollButton());
      await flushMicrotasks();
      expect(animate).toHaveBeenCalledOnce();
    } finally {
      restore();
      Reflect.deleteProperty(HTMLElement.prototype, 'animate');
    }
  });

  it('exposes a focusable native button for keyboard activation', () => {
    render(<Dice />);
    const button = rollButton();
    expect(button.tagName).toBe('BUTTON');
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});
