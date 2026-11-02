import {
  AnimationError,
  GameStateError,
  ResultProviderError,
  createSpinWheel,
  type SpinWheelResult,
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
import { SpinWheel, type SpinWheelRef } from './index.js';

const SEGMENTS = [
  { id: 'points', label: '100 points' },
  { id: 'badge', label: 'Badge' },
  { id: 'retry', label: 'Try again' },
] as const;
const DURATION = 1_000;
const spinButton = () => screen.getByRole('button', { name: /Spin/ });

describe('SpinWheel (web)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('resolves a random result from the injected source and completes after the animation', async () => {
    const values = [0.7];
    const expected = createSpinWheel({
      randomSource: new SequenceRandomSource(values),
      segments: SEGMENTS,
    }).spin();
    const onComplete = vi.fn();
    render(
      <SpinWheel
        duration={DURATION}
        onComplete={onComplete}
        randomSource={new SequenceRandomSource(values)}
        segments={SEGMENTS}
      />,
    );

    fireEvent.click(spinButton());
    await flushMicrotasks();
    expect(onComplete).not.toHaveBeenCalled();
    expect(spinButton().textContent).toBe('Spinning…');

    await advance(DURATION);
    expect(onComplete).toHaveBeenCalledOnce();
    const [result] = onComplete.mock.calls[0] as [SpinWheelResult];
    expect(result).toMatchObject({ game: 'spin-wheel', segmentId: expected.segmentId });
    expect(result.segment.id).toBe(expected.segmentId);
    expect(screen.getByRole('status').textContent).toBe(
      `Selected: ${expected.segment.label ?? expected.segment.id}`,
    );
  });

  it('honours a controlled result and emits the lifecycle in order', async () => {
    const log = createEventLog();
    const statuses: string[] = [];
    const onPlayStart = vi.fn();
    const onAnimationStart = vi.fn();
    render(
      <SpinWheel
        duration={DURATION}
        onAnimationStart={onAnimationStart}
        onEvent={log.onEvent}
        onPlayStart={onPlayStart}
        onStatusChange={(status) => statuses.push(status)}
        result={{ segmentId: 'badge' }}
        segments={SEGMENTS}
      />,
    );

    fireEvent.click(spinButton());
    await advance(DURATION);

    expect(onPlayStart).toHaveBeenCalledOnce();
    expect(onAnimationStart).toHaveBeenCalledWith(expect.objectContaining({ segmentId: 'badge' }));
    expect(log.types).toEqual([
      'ready',
      'play-start',
      'result-resolved',
      'animation-start',
      'reveal-start',
      'complete',
    ]);
    expect(statuses.at(-1)).toBe('completed');
    expect(screen.getByRole('status').textContent).toBe('Selected: Badge');
  });

  it('requests a provider result with the request payload and stays busy until it resolves', async () => {
    const deferred = createDeferred<{ readonly segmentId: string }>();
    const resultProvider = vi.fn<
      (request: { readonly playId: string }) => Promise<{ readonly segmentId: string }>
    >(() => deferred.promise);
    const onResultRequest = vi.fn();
    const onComplete = vi.fn();
    render(
      <SpinWheel
        duration={DURATION}
        onComplete={onComplete}
        onResultRequest={onResultRequest}
        resultProvider={resultProvider}
        resultRequest={{ playId: 'play-1' }}
        segments={SEGMENTS}
      />,
    );

    fireEvent.click(spinButton());
    await flushMicrotasks();
    expect(resultProvider).toHaveBeenCalledWith({ playId: 'play-1' });
    expect(onResultRequest).toHaveBeenCalledOnce();
    expect((spinButton() as HTMLButtonElement).disabled).toBe(true);
    expect(spinButton().getAttribute('aria-busy')).toBe('true');

    deferred.resolve({ segmentId: 'retry' });
    await flushMicrotasks();
    await advance(DURATION);
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ segmentId: 'retry' }));
  });

  it('reports a rejected provider through onError and recovers for another play', async () => {
    const failure = new Error('network down');
    const onError = vi.fn();
    const onComplete = vi.fn();
    const log = createEventLog();
    const resultProvider = vi
      .fn<() => Promise<{ readonly segmentId: string }>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({ segmentId: 'points' });
    render(
      <SpinWheel
        duration={DURATION}
        onComplete={onComplete}
        onError={onError}
        onEvent={log.onEvent}
        resultProvider={resultProvider}
        segments={SEGMENTS}
      />,
    );

    fireEvent.click(spinButton());
    await flushMicrotasks();
    expect(onError).toHaveBeenCalledOnce();
    const [error] = onError.mock.calls[0] as [unknown];
    expect(error).toBeInstanceOf(ResultProviderError);
    expect((error as ResultProviderError).cause).toBe(failure);
    expect(log.types).toContain('error');
    expect(onComplete).not.toHaveBeenCalled();
    expect((spinButton() as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole('status').textContent).toBe('');

    fireEvent.click(spinButton());
    await flushMicrotasks();
    await advance(DURATION);
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ segmentId: 'points' }));
  });

  // Regression: a second activation before the animation flag rendered resolved a second random
  // result, so onComplete reported the first result while the status text showed the second.
  it('ignores a rapid second activation and reports the result it displays', async () => {
    const onComplete = vi.fn();
    const onResultResolved = vi.fn();
    const onError = vi.fn();
    render(
      <SpinWheel
        duration={DURATION}
        onComplete={onComplete}
        onError={onError}
        onResultResolved={onResultResolved}
        randomSource={new SequenceRandomSource([0.1, 0.9])}
        segments={SEGMENTS}
      />,
    );

    fireEvent.click(spinButton());
    fireEvent.click(spinButton());
    await advance(DURATION);

    expect(onResultResolved).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
    const [result] = onComplete.mock.calls[0] as [SpinWheelResult];
    expect(screen.getByRole('status').textContent).toBe(
      `Selected: ${result.segment.label ?? result.segment.id}`,
    );
  });

  it('cancels an in-flight spin on reset without completing it', async () => {
    const reference = createRef<SpinWheelRef>();
    const onComplete = vi.fn();
    const onReset = vi.fn();
    render(
      <SpinWheel
        duration={DURATION}
        onComplete={onComplete}
        onReset={onReset}
        ref={reference}
        result={{ segmentId: 'badge' }}
        segments={SEGMENTS}
      />,
    );

    let settled: Promise<unknown> = Promise.resolve();
    await act(async () => {
      settled = (reference.current?.spin() ?? Promise.resolve()).catch((error: unknown) => error);
      await Promise.resolve();
    });
    await advance(DURATION / 2);
    act(() => reference.current?.reset());
    await advance(DURATION);

    await expect(settled).resolves.toBeInstanceOf(AnimationError);
    expect(onComplete).not.toHaveBeenCalled();
    expect(onReset).toHaveBeenCalledOnce();
    expect(screen.getByRole('status').textContent).toBe('');
    expect(spinButton().textContent).toBe('Spin');

    fireEvent.click(spinButton());
    await advance(DURATION);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('keeps a disabled wheel idle and rejects imperative spins', async () => {
    const reference = createRef<SpinWheelRef>();
    const onError = vi.fn();
    render(<SpinWheel disabled onError={onError} ref={reference} segments={SEGMENTS} />);

    const button = spinButton() as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    // Disabled is not busy: the control keeps its idle name and does not claim to be spinning.
    expect(button.getAttribute('aria-busy')).toBe('false');
    expect(button.textContent).toBe('Spin');
    await expect(reference.current?.spin()).rejects.toBeInstanceOf(GameStateError);
    expect(onError).toHaveBeenCalledOnce();
  });

  it('uses the reduced-motion duration and no extra rotations when the system asks', async () => {
    const restore = mockReducedMotionPreference(true);
    try {
      const onComplete = vi.fn();
      const { container } = render(
        <SpinWheel
          duration={DURATION}
          onComplete={onComplete}
          result={{ segmentId: 'badge' }}
          segments={SEGMENTS}
        />,
      );
      await flushMicrotasks();
      fireEvent.click(spinButton());
      await flushMicrotasks();

      const disc = container.querySelector<HTMLElement>('[style*="rotate("]');
      expect(disc?.style.transition).toContain('160ms');
      const rotation = Number(/rotate\((-?[\d.]+)deg\)/.exec(disc?.style.transform ?? '')?.[1]);
      expect(Math.abs(rotation)).toBeLessThan(360);

      await advance(160);
      expect(onComplete).toHaveBeenCalledOnce();
    } finally {
      restore();
    }
  });

  it('lets an explicit reduceMotion={false} override the system preference', async () => {
    const restore = mockReducedMotionPreference(true);
    try {
      const onComplete = vi.fn();
      render(
        <SpinWheel
          duration={DURATION}
          onComplete={onComplete}
          reduceMotion={false}
          result={{ segmentId: 'badge' }}
          segments={SEGMENTS}
        />,
      );
      fireEvent.click(spinButton());
      await advance(160);
      expect(onComplete).not.toHaveBeenCalled();
      await advance(DURATION);
      expect(onComplete).toHaveBeenCalledOnce();
    } finally {
      restore();
    }
  });

  it('exposes a focusable native button for keyboard activation', () => {
    render(<SpinWheel segments={SEGMENTS} />);
    const button = spinButton();
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});
