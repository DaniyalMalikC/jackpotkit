import {
  AnimationError,
  GameStateError,
  ResultProviderError,
  createLuckyBox,
  type LuckyBoxResult,
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
import { LuckyBox, type LuckyBoxRef } from './index.js';

const BOXES = [
  { id: 'red', label: 'Red' },
  { id: 'gold', label: 'Gold' },
  { id: 'blue', label: 'Blue' },
  { disabled: true, id: 'locked', label: 'Locked' },
] as const;
const DURATION = 420;
const box = (label: string) => screen.getByRole('button', { name: new RegExp(`^(★ )?${label}`) });
const revealButton = () => screen.getByRole('button', { name: /Reveal/ });
const status = () => screen.getByRole('status').textContent;

describe('LuckyBox (web)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('requires a selection, then reveals the winner chosen by the random source', async () => {
    const engine = createLuckyBox({
      boxes: BOXES,
      randomSource: new SequenceRandomSource([0.5]),
    });
    engine.select('red');
    const expected = engine.reveal();
    const onSelect = vi.fn();
    const onComplete = vi.fn();
    render(
      <LuckyBox
        boxes={BOXES}
        duration={DURATION}
        onComplete={onComplete}
        onSelect={onSelect}
        randomSource={new SequenceRandomSource([0.5])}
      />,
    );

    expect((revealButton() as HTMLButtonElement).disabled).toBe(true);
    expect((box('Locked') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(box('Red'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'red' }));
    expect(box('Red').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(revealButton());
    await flushMicrotasks();
    expect(revealButton().textContent).toBe('Revealing…');
    expect(revealButton().getAttribute('aria-busy')).toBe('true');
    await advance(DURATION);

    expect(onComplete).toHaveBeenCalledOnce();
    const [result] = onComplete.mock.calls[0] as [LuckyBoxResult];
    expect(result).toMatchObject({
      game: 'lucky-box',
      won: expected.won,
    });
    expect(result.selectedBox.id).toBe('red');
    expect(result.winningBox.id).toBe(expected.winningBox.id);
    expect(status()).toBe(
      expected.won
        ? 'You found the winning box!'
        : `Winning box: ${expected.winningBox.label ?? expected.winningBox.id}`,
    );
    // A revealed game locks every box until reset.
    expect((box('Gold') as HTMLButtonElement).disabled).toBe(true);
  });

  it('honours a controlled winner and reports a loss for another selection', async () => {
    const log = createEventLog();
    render(
      <LuckyBox
        boxes={BOXES}
        duration={DURATION}
        onEvent={log.onEvent}
        result={{ boxId: 'gold' }}
      />,
    );

    fireEvent.click(box('Blue'));
    fireEvent.click(revealButton());
    await advance(DURATION);
    expect(status()).toBe('Winning box: Gold');
    expect(box('Gold').textContent).toContain('★');
    expect(log.types).toEqual([
      'ready',
      'play-start',
      'result-resolved',
      'animation-start',
      'reveal-start',
      'complete',
    ]);
  });

  it('reports a rejected provider and keeps the selection available for a retry', async () => {
    const onError = vi.fn();
    const resultProvider = vi
      .fn<() => Promise<{ readonly boxId: string }>>()
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce({ boxId: 'red' });
    render(
      <LuckyBox
        boxes={BOXES}
        duration={DURATION}
        onError={onError}
        resultProvider={resultProvider}
      />,
    );

    fireEvent.click(box('Red'));
    fireEvent.click(revealButton());
    await flushMicrotasks();
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(ResultProviderError);
    expect((revealButton() as HTMLButtonElement).disabled).toBe(false);
    expect(box('Red').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(revealButton());
    await flushMicrotasks();
    await advance(DURATION);
    expect(status()).toBe('You found the winning box!');
  });

  // Regression: a rapid second click on Reveal asked the engine to reveal twice, which raised a
  // GameStateError through onError while the first reveal was still animating.
  it('ignores a rapid second reveal without reporting an error', async () => {
    const onComplete = vi.fn();
    const onError = vi.fn();
    render(
      <LuckyBox
        boxes={BOXES}
        duration={DURATION}
        onComplete={onComplete}
        onError={onError}
        randomSource={new SequenceRandomSource([0, 0.9])}
      />,
    );

    fireEvent.click(box('Red'));
    fireEvent.click(revealButton());
    fireEvent.click(revealButton());
    await advance(DURATION);

    expect(onError).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('picks imperatively, and reset cancels the reveal and clears the selection', async () => {
    const reference = createRef<LuckyBoxRef>();
    const onComplete = vi.fn();
    const onReset = vi.fn();
    render(
      <LuckyBox
        boxes={BOXES}
        duration={DURATION}
        onComplete={onComplete}
        onReset={onReset}
        ref={reference}
        result={{ boxId: 'blue' }}
      />,
    );

    let settled: Promise<unknown> = Promise.resolve();
    await act(async () => {
      settled = (reference.current?.pick('blue') ?? Promise.resolve()).catch(
        (error: unknown) => error,
      );
      await Promise.resolve();
    });
    expect(box('Blue').getAttribute('aria-pressed')).toBe('true');
    act(() => reference.current?.reset());
    await advance(DURATION);

    await expect(settled).resolves.toBeInstanceOf(AnimationError);
    expect(onComplete).not.toHaveBeenCalled();
    expect(onReset).toHaveBeenCalledOnce();
    expect(box('Blue').getAttribute('aria-pressed')).toBe('false');
    expect((box('Red') as HTMLButtonElement).disabled).toBe(false);
    expect((revealButton() as HTMLButtonElement).disabled).toBe(true);
    expect(status()).toBe('');
  });

  it('disables every control and rejects imperative reveals when disabled', async () => {
    const reference = createRef<LuckyBoxRef>();
    render(<LuckyBox boxes={BOXES} disabled ref={reference} />);

    expect((box('Red') as HTMLButtonElement).disabled).toBe(true);
    expect((revealButton() as HTMLButtonElement).disabled).toBe(true);
    expect(revealButton().getAttribute('aria-busy')).toBe('false');
    await expect(reference.current?.reveal()).rejects.toBeInstanceOf(GameStateError);
  });

  it('uses the reduced-motion duration when the system asks', async () => {
    const restore = mockReducedMotionPreference(true);
    try {
      const onComplete = vi.fn();
      render(
        <LuckyBox
          boxes={BOXES}
          duration={DURATION}
          onComplete={onComplete}
          result={{ boxId: 'red' }}
        />,
      );
      await flushMicrotasks();
      expect(box('Red').style.transition).toContain('160ms');
      fireEvent.click(box('Red'));
      fireEvent.click(revealButton());
      await advance(160);
      expect(onComplete).toHaveBeenCalledOnce();
    } finally {
      restore();
    }
  });

  it('exposes boxes as focusable toggle buttons for keyboard selection', () => {
    render(<LuckyBox boxes={BOXES} />);
    const red = box('Red');
    expect(red.tagName).toBe('BUTTON');
    expect(red.getAttribute('aria-pressed')).toBe('false');
    red.focus();
    expect(document.activeElement).toBe(red);
  });
});
