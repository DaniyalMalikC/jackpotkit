import {
  AnimationError,
  GameStateError,
  ResultProviderError,
  createCoinFlip,
  type CoinFlipResult,
} from '@jackpotkit/core';
import { SequenceRandomSource } from '@jackpotkit/testing';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  advance,
  createEventLog,
  flushMicrotasks,
  mockReducedMotionPreference,
} from '../__tests__/test-utils.js';
import { CoinFlip, type CoinFlipRef } from './index.js';

const DURATION = 800;
const flipButton = () => screen.getByRole('button', { name: /Flip/ });
const status = () => screen.getByRole('status').textContent;
const coinRotation = (container: HTMLElement) =>
  Number(
    /rotateY\((-?[\d.]+)deg\)/.exec(
      container.querySelector<HTMLElement>('[style*="rotateY("]')?.style.transform ?? '',
    )?.[1],
  );

describe('CoinFlip (web)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('flips to the face chosen by the injected random source', async () => {
    const expected = createCoinFlip({ randomSource: new SequenceRandomSource([0.9]) }).flip();
    const onComplete = vi.fn();
    render(
      <CoinFlip
        duration={DURATION}
        onComplete={onComplete}
        randomSource={new SequenceRandomSource([0.9])}
      />,
    );

    fireEvent.click(flipButton());
    await flushMicrotasks();
    expect(flipButton().textContent).toBe('Flipping…');
    await advance(DURATION);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0]?.[0]).toMatchObject({
      faceId: expected.faceId,
      game: 'coin-flip',
    });
    expect(status()).toBe(`Result: ${expected.face.label ?? expected.face.id}`);
  });

  it('honours controlled results, custom faces, and the lifecycle order', async () => {
    const log = createEventLog();
    const faces = [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ] as const;
    render(
      <CoinFlip
        duration={DURATION}
        faces={faces}
        onEvent={log.onEvent}
        result={{ faceId: 'no' }}
      />,
    );

    fireEvent.click(flipButton());
    await advance(DURATION);
    expect(status()).toBe('Result: No');
    expect(screen.getByLabelText('Coin face: No')).toBeDefined();
    expect(log.types).toEqual([
      'ready',
      'play-start',
      'result-resolved',
      'animation-start',
      'reveal-start',
      'complete',
    ]);
  });

  it('reports a rejected provider and stays playable', async () => {
    const onError = vi.fn();
    const resultProvider = vi
      .fn<() => Promise<{ readonly faceId: string }>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ faceId: 'tails' });
    render(<CoinFlip duration={DURATION} onError={onError} resultProvider={resultProvider} />);

    fireEvent.click(flipButton());
    await flushMicrotasks();
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(ResultProviderError);
    expect((flipButton() as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(flipButton());
    await flushMicrotasks();
    await advance(DURATION);
    expect(status()).toBe('Result: Tails');
  });

  // Regression: a rapid second click resolved a second random flip, so the status text and the
  // onComplete payload could disagree.
  it('ignores a rapid second flip', async () => {
    const onComplete = vi.fn();
    const onResultResolved = vi.fn();
    render(
      <CoinFlip
        duration={DURATION}
        onComplete={onComplete}
        onResultResolved={onResultResolved}
        randomSource={new SequenceRandomSource([0.1, 0.9])}
      />,
    );

    fireEvent.click(flipButton());
    fireEvent.click(flipButton());
    await advance(DURATION);

    expect(onResultResolved).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledOnce();
    const [result] = onComplete.mock.calls[0] as [CoinFlipResult];
    expect(status()).toBe(`Result: ${result.face.label ?? result.face.id}`);
  });

  it('cancels on reset, then lands correctly on the next flip', async () => {
    const reference = createRef<CoinFlipRef>();
    const onComplete = vi.fn();
    const { container } = render(
      <CoinFlip duration={DURATION} onComplete={onComplete} ref={reference} />,
    );

    let settled: Promise<unknown> = Promise.resolve();
    await act(async () => {
      settled = (reference.current?.flipTo({ faceId: 'tails' }) ?? Promise.resolve()).catch(
        (error: unknown) => error,
      );
      await Promise.resolve();
    });
    act(() => reference.current?.reset());
    await advance(DURATION);
    await expect(settled).resolves.toBeInstanceOf(AnimationError);
    expect(onComplete).not.toHaveBeenCalled();
    expect(coinRotation(container)).toBe(0);
    expect(status()).toBe('');

    let flipped: Promise<unknown> | undefined;
    await act(async () => {
      flipped = reference.current?.flipTo({ faceId: 'tails' });
      await vi.advanceTimersByTimeAsync(DURATION);
    });
    await expect(flipped).resolves.toMatchObject({ faceId: 'tails' });
    expect(coinRotation(container)).toBe(180);
  });

  it('keeps a disabled coin idle and rejects imperative flips', async () => {
    const reference = createRef<CoinFlipRef>();
    render(<CoinFlip disabled ref={reference} />);

    expect((flipButton() as HTMLButtonElement).disabled).toBe(true);
    expect(flipButton().getAttribute('aria-busy')).toBe('false');
    expect(flipButton().textContent).toBe('Flip coin');
    await expect(reference.current?.flip()).rejects.toBeInstanceOf(GameStateError);
  });

  it('turns straight to the result face without extra spins under reduced motion', async () => {
    const restore = mockReducedMotionPreference(true);
    try {
      const onComplete = vi.fn();
      const { container } = render(
        <CoinFlip duration={DURATION} onComplete={onComplete} result={{ faceId: 'tails' }} />,
      );
      await flushMicrotasks();
      fireEvent.click(flipButton());
      await flushMicrotasks();
      expect(coinRotation(container)).toBe(180);

      await advance(160);
      expect(onComplete).toHaveBeenCalledOnce();
    } finally {
      restore();
    }
  });

  it('spins several turns when motion is allowed', async () => {
    const { container } = render(<CoinFlip duration={DURATION} result={{ faceId: 'tails' }} />);
    fireEvent.click(flipButton());
    await flushMicrotasks();
    expect(coinRotation(container)).toBe(4 * 360 + 180);
  });

  it('exposes a focusable native button for keyboard activation', () => {
    render(<CoinFlip />);
    const button = flipButton();
    expect(button.tagName).toBe('BUTTON');
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});
