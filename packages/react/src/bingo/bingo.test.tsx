import { GameStateError, createBingo } from '@jackpotkit/core';
import { SequenceRandomSource } from '@jackpotkit/testing';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createEventLog, mockReducedMotionPreference } from '../__tests__/test-utils.js';
import { Bingo, type BingoRef } from './index.js';

const BOARD = [
  [1, 2, 3],
  [4, 'free', 5],
  [6, 7, 8],
] as const;
const PATTERNS = ['row'] as const;
const FULL_BOARD = ['full-board'] as const;
const cell = (name: string) => screen.getByRole('button', { name });
const callButton = () =>
  screen.getByRole('button', { name: /^(Call next number|Last call: \d+|All numbers called)$/ });
const status = () => screen.getByRole('status').textContent;

function renderBingo(props: Partial<Parameters<typeof Bingo>[0]> = {}) {
  return render(<Bingo board={BOARD} maxNumber={9} patterns={PATTERNS} size={3} {...props} />);
}

describe('Bingo (web)', () => {
  afterEach(cleanup);

  it('draws numbers from the injected random source', () => {
    const values = [0.3, 0.6];
    const engine = createBingo({
      board: BOARD,
      maxNumber: 9,
      patterns: PATTERNS,
      randomSource: new SequenceRandomSource(values),
      size: 3,
    });
    const expected = [engine.draw(), engine.draw()];
    const onCall = vi.fn<(number: number) => void>();
    renderBingo({ onCall, randomSource: new SequenceRandomSource(values) });

    expect(callButton().textContent).toBe('Call next number');
    fireEvent.click(callButton());
    fireEvent.click(callButton());

    expect(onCall.mock.calls.map(([number]) => number)).toEqual(expected);
    expect(callButton().textContent).toBe(`Last call: ${expected[1]}`);
    expect((cell(`Number ${expected[0]}, called`) as HTMLButtonElement).disabled).toBe(false);
  });

  it('marks called cells, completes a pattern once, and reports the result', () => {
    const reference = createRef<BingoRef>();
    const onMark = vi.fn();
    const onUnmark = vi.fn();
    const onComplete = vi.fn();
    const log = createEventLog();
    renderBingo({ onComplete, onEvent: log.onEvent, onMark, onUnmark, ref: reference });

    expect((cell('Number 4, not called') as HTMLButtonElement).disabled).toBe(true);
    act(() => {
      reference.current?.call(4);
      reference.current?.call(5);
    });
    fireEvent.click(cell('Number 4, called'));
    expect(onMark).toHaveBeenCalledWith(4, expect.objectContaining({ markedNumbers: [4] }));
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(cell('Number 5, called'));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0]?.[0]).toMatchObject({ game: 'bingo' });
    expect(status()).toMatch(/^Bingo! Completed .+\.$/);
    expect(cell('Number 5, called, marked').getAttribute('aria-pressed')).toBe('true');
    expect((callButton() as HTMLButtonElement).disabled).toBe(true);
    expect(log.types.filter((type) => type === 'complete')).toHaveLength(1);

    // Toggling a cell off un-completes the board; marking it again completes it again.
    fireEvent.click(cell('Number 5, called, marked'));
    expect(onUnmark).toHaveBeenCalledWith(5, expect.anything());
    expect(status()).toBe('');
    fireEvent.click(cell('Number 5, called'));
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('resets calls, marks, and the completed result', () => {
    const reference = createRef<BingoRef>();
    const onReset = vi.fn();
    renderBingo({ onReset, ref: reference });

    act(() => {
      reference.current?.call(4);
      reference.current?.mark(4);
    });
    expect(cell('Number 4, called, marked')).toBeDefined();
    act(() => {
      reference.current?.reset();
    });

    expect(onReset).toHaveBeenCalledOnce();
    expect((cell('Number 4, not called') as HTMLButtonElement).disabled).toBe(true);
    expect(callButton().textContent).toBe('Call next number');
    expect(status()).toBe('');
  });

  it('reports engine errors from invalid calls through onError', () => {
    const reference = createRef<BingoRef>();
    const onError = vi.fn();
    renderBingo({ onError, ref: reference });

    expect(() => reference.current?.call(99)).toThrow();
    expect(onError).toHaveBeenCalledOnce();
  });

  it('disables every cell and the call button, and rejects imperative calls', () => {
    const reference = createRef<BingoRef>();
    const onError = vi.fn();
    renderBingo({ disabled: true, onError, ref: reference });

    expect((callButton() as HTMLButtonElement).disabled).toBe(true);
    expect((cell('Number 1, not called') as HTMLButtonElement).disabled).toBe(true);
    expect(() => reference.current?.call(1)).toThrow(GameStateError);
    expect(onError).toHaveBeenCalledOnce();
  });

  it('stops the call button once every number has been called', () => {
    const reference = createRef<BingoRef>();
    renderBingo({ patterns: FULL_BOARD, ref: reference });

    act(() => {
      for (let number = 1; number <= 9; number += 1) reference.current?.call(number);
    });
    expect(callButton().textContent).toBe('All numbers called');
    expect((callButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it('uses the reduced-motion duration for mark transitions', () => {
    const restore = mockReducedMotionPreference(true);
    try {
      renderBingo();
      expect(cell('Number 1, not called').style.transition).toContain('160ms');
    } finally {
      restore();
    }
    cleanup();
    renderBingo({ reduceMotion: false });
    expect(cell('Number 1, not called').style.transition).toContain('180ms');
  });

  it('uses native toggle buttons so cells are keyboard operable', () => {
    const reference = createRef<BingoRef>();
    renderBingo({ ref: reference });
    act(() => {
      reference.current?.call(2);
    });
    const two = cell('Number 2, called');
    expect(two.tagName).toBe('BUTTON');
    expect(two.getAttribute('aria-pressed')).toBe('false');
    two.focus();
    expect(document.activeElement).toBe(two);
  });
});
