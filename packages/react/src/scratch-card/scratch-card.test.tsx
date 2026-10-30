import {
  AnimationError,
  GameStateError,
  ResultProviderError,
  type ScratchCardResult,
} from '@jackpotkit/core';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  advance,
  createDeferred,
  flushMicrotasks,
  mockReducedMotionPreference,
} from '../__tests__/test-utils.js';
import { ScratchCard, type ScratchCardRef } from './index.js';

const WIDTH = 120;
const HEIGHT = 60;
const REVEAL = 320;
const revealButton = () => screen.getByRole('button', { name: 'Reveal card' });
const status = () => screen.getByRole('status').textContent;

/** jsdom has no 2D canvas; the renderer only needs these drawing calls to exist. */
function mockCanvasContext() {
  const context = {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  return context;
}

function getCanvas(container: HTMLElement): HTMLCanvasElement {
  const canvas = container.querySelector<HTMLCanvasElement>('[data-jackpotkit-scratch-canvas]');
  if (canvas === null) throw new Error('Scratch canvas not rendered.');
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    value: () => ({ bottom: HEIGHT, height: HEIGHT, left: 0, right: WIDTH, top: 0, width: WIDTH }),
  });
  Object.defineProperty(canvas, 'setPointerCapture', { value: vi.fn() });
  return canvas;
}

/** Drags across the whole card in horizontal passes, enough to pass any threshold. */
async function scratchEverything(canvas: HTMLCanvasElement) {
  fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0, pointerId: 1 });
  await flushMicrotasks();
  for (let y = 0; y <= HEIGHT; y += 10) {
    fireEvent.pointerMove(canvas, { clientX: WIDTH, clientY: y, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 0, clientY: y + 5, pointerId: 1 });
  }
  fireEvent.pointerUp(canvas, { pointerId: 1 });
}

describe('ScratchCard (web)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockCanvasContext();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('auto-reveals after the pointer scratches past the threshold', async () => {
    const onProgress = vi.fn<(progress: number) => void>();
    const onComplete = vi.fn();
    const onPlayStart = vi.fn();
    const { container } = render(
      <ScratchCard
        brushRadius={16}
        height={HEIGHT}
        onComplete={onComplete}
        onPlayStart={onPlayStart}
        onProgress={onProgress}
        result={{ prize: 'Gold' }}
        revealDuration={REVEAL}
        threshold={0.5}
        width={WIDTH}
      >
        {(result: ScratchCardResult<string> | undefined) => result?.prize ?? 'hidden'}
      </ScratchCard>,
    );
    const canvas = getCanvas(container);
    expect(canvas.getAttribute('aria-label')).toBe('0 percent scratched');

    await scratchEverything(canvas);
    await flushMicrotasks();
    expect(onPlayStart).toHaveBeenCalledOnce();
    const progress = onProgress.mock.calls.map(([value]) => value);
    expect(progress.length).toBeGreaterThan(1);
    expect(progress).toEqual([...progress].sort((left, right) => left - right));
    expect(progress.at(-1)).toBeGreaterThanOrEqual(0.5);
    expect(onComplete).not.toHaveBeenCalled();

    await advance(REVEAL);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0]?.[0]).toMatchObject({ game: 'scratch-card', prize: 'Gold' });
    expect(status()).toBe('Prize revealed');
    expect(screen.getByText('Gold')).toBeDefined();
    expect((revealButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it('leaves the cover in place past the threshold when autoReveal is off', async () => {
    const onComplete = vi.fn();
    const { container } = render(
      <ScratchCard
        autoReveal={false}
        brushRadius={16}
        height={HEIGHT}
        onComplete={onComplete}
        result={{ prize: 'Gold' }}
        threshold={0.3}
        width={WIDTH}
      >
        Gold
      </ScratchCard>,
    );

    await scratchEverything(getCanvas(container));
    await advance(REVEAL);
    expect(onComplete).not.toHaveBeenCalled();
    expect((revealButton() as HTMLButtonElement).disabled).toBe(false);
    expect(status()).toMatch(/^\d+% scratched$/);
  });

  it('reveals a provider prize through the accessible Reveal button', async () => {
    const deferred = createDeferred<{ readonly prize: string }>();
    const resultProvider = vi.fn<
      (request: { readonly cardId: string }) => Promise<{ readonly prize: string }>
    >(() => deferred.promise);
    const onComplete = vi.fn();
    render(
      <ScratchCard
        height={HEIGHT}
        onComplete={onComplete}
        resultProvider={resultProvider}
        resultRequest={{ cardId: 'card-7' }}
        revealDuration={REVEAL}
        width={WIDTH}
      >
        {(result: ScratchCardResult<string> | undefined) => result?.prize ?? 'hidden'}
      </ScratchCard>,
    );

    fireEvent.click(revealButton());
    await flushMicrotasks();
    expect(resultProvider).toHaveBeenCalledWith({ cardId: 'card-7' });
    expect((revealButton() as HTMLButtonElement).disabled).toBe(true);

    deferred.resolve({ prize: 'Bonus' });
    await flushMicrotasks();
    await advance(REVEAL);
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ prize: 'Bonus' }));
    expect(screen.getByText('Bonus')).toBeDefined();
  });

  it('reports a rejected provider and lets the player try again', async () => {
    const onError = vi.fn();
    const onComplete = vi.fn();
    const resultProvider = vi
      .fn<() => Promise<{ readonly prize: string }>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ prize: 'Retry prize' });
    render(
      <ScratchCard
        height={HEIGHT}
        onComplete={onComplete}
        onError={onError}
        resultProvider={resultProvider}
        revealDuration={REVEAL}
        width={WIDTH}
      >
        Prize
      </ScratchCard>,
    );

    fireEvent.click(revealButton());
    await flushMicrotasks();
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(ResultProviderError);
    expect(onComplete).not.toHaveBeenCalled();
    expect((revealButton() as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(revealButton());
    await flushMicrotasks();
    await advance(REVEAL);
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ prize: 'Retry prize' }));
  });

  it('completes once when Reveal is activated twice in a row', async () => {
    const onComplete = vi.fn();
    const onError = vi.fn();
    render(
      <ScratchCard
        height={HEIGHT}
        onComplete={onComplete}
        onError={onError}
        result={{ prize: 'Gold' }}
        revealDuration={REVEAL}
        width={WIDTH}
      >
        Gold
      </ScratchCard>,
    );

    fireEvent.click(revealButton());
    fireEvent.click(revealButton());
    await advance(REVEAL);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it('cancels a reveal on reset and restores the cover and progress', async () => {
    const reference = createRef<ScratchCardRef>();
    const onComplete = vi.fn();
    const onReset = vi.fn();
    const { container } = render(
      <ScratchCard
        height={HEIGHT}
        onComplete={onComplete}
        onReset={onReset}
        ref={reference}
        result={{ prize: 'Gold' }}
        revealDuration={REVEAL}
        width={WIDTH}
      >
        Gold
      </ScratchCard>,
    );

    let settled: Promise<unknown> = Promise.resolve();
    await act(async () => {
      settled = (reference.current?.reveal() ?? Promise.resolve()).catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect((revealButton() as HTMLButtonElement).disabled).toBe(true);
    act(() => reference.current?.reset());
    await advance(REVEAL);

    await expect(settled).resolves.toBeInstanceOf(AnimationError);
    expect(onComplete).not.toHaveBeenCalled();
    expect(onReset).toHaveBeenCalledOnce();
    expect((revealButton() as HTMLButtonElement).disabled).toBe(false);
    expect(status()).toBe('0% scratched');
    expect(getCanvas(container).style.opacity).toBe('1');
  });

  it('ignores pointer input and rejects reveals while disabled', async () => {
    const reference = createRef<ScratchCardRef>();
    const onPlayStart = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <ScratchCard
        disabled
        height={HEIGHT}
        onError={onError}
        onPlayStart={onPlayStart}
        ref={reference}
        result={{ prize: 'Gold' }}
        width={WIDTH}
      >
        Gold
      </ScratchCard>,
    );

    await scratchEverything(getCanvas(container));
    expect(onPlayStart).not.toHaveBeenCalled();
    expect(status()).toBe('0% scratched');
    expect((revealButton() as HTMLButtonElement).disabled).toBe(true);
    await expect(reference.current?.reveal()).rejects.toBeInstanceOf(GameStateError);
    expect(onError).toHaveBeenCalled();
  });

  it('fades the cover with the reduced-motion duration when the system asks', async () => {
    const restore = mockReducedMotionPreference(true);
    try {
      const onComplete = vi.fn();
      const { container } = render(
        <ScratchCard
          height={HEIGHT}
          onComplete={onComplete}
          result={{ prize: 'Gold' }}
          revealDuration={REVEAL}
          width={WIDTH}
        >
          Gold
        </ScratchCard>,
      );
      await flushMicrotasks();
      expect(getCanvas(container).style.transition).toContain('160ms');
      fireEvent.click(revealButton());
      await advance(160);
      expect(onComplete).toHaveBeenCalledOnce();
    } finally {
      restore();
    }
  });

  it('offers a focusable native Reveal button as the non-gesture path', () => {
    render(
      <ScratchCard height={HEIGHT} result={{ prize: 'Gold' }} width={WIDTH}>
        Gold
      </ScratchCard>,
    );
    const button = revealButton();
    expect(button.tagName).toBe('BUTTON');
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});
