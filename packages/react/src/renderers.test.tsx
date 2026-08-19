import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Bingo, type BingoRef } from './bingo/index.js';
import { CoinFlip } from './coin-flip/index.js';
import { Dice } from './dice/index.js';
import { LuckyBox } from './lucky-box/index.js';
import { ScratchCard } from './scratch-card/index.js';
import { SlotMachine } from './slot-machine/index.js';
import { SpinWheel } from './spin-wheel/index.js';

describe('React web renderers', () => {
  it('renders and completes the one-shot games with controlled core selections', async () => {
    const spin = render(
      <SpinWheel
        duration={0}
        result={{ segmentId: 'two' }}
        segments={[
          { id: 'one', label: 'One' },
          { id: 'two', label: 'Two' },
        ]}
        size={200}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Spin' }));
    expect(await screen.findByText('Selected: Two')).toBeDefined();
    spin.unmount();

    const dice = render(<Dice duration={0} result={{ values: [6] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));
    expect(await screen.findByText('Total: 6')).toBeDefined();
    dice.unmount();

    const coin = render(
      <CoinFlip duration={0} faceStyle="embossed" result={{ faceId: 'heads' }} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Flip coin' }));
    expect(await screen.findByText('Result: Heads')).toBeDefined();
    expect(coin.container.querySelectorAll('[data-jackpotkit-coin-rim]')).toHaveLength(2);
    coin.unmount();

    const lucky = render(
      <LuckyBox
        boxes={[
          { id: 'alpha', label: 'Alpha' },
          { id: 'beta', label: 'Beta' },
        ]}
        duration={0}
        result={{ boxId: 'alpha' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reveal selection' }));
    expect(await screen.findByText('You found the winning box!')).toBeDefined();
    lucky.unmount();

    const slot = render(
      <SlotMachine
        duration={0}
        reelCount={2}
        reelDelay={0}
        result={{ reels: [['cherry'], ['cherry']] }}
        rowCount={1}
        symbols={[
          { id: 'cherry', label: 'Cherry' },
          { id: 'seven', label: 'Seven' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Spin reels' }));
    expect(await screen.findByText('1 winning payline')).toBeDefined();
    expect(slot.container.querySelector('[data-jackpotkit-slot-cabinet]')).not.toBeNull();
    expect(slot.container.querySelectorAll('[data-jackpotkit-slot-reel]')).toHaveLength(2);
    const slotStrip = slot.container.querySelector<HTMLElement>('[data-jackpotkit-slot-strip]');
    expect(slotStrip?.style.transform).toContain('translate3d');
    expect(slotStrip?.style.transform).not.toContain('rotateX');
  });

  it('supports an accessible manual Scratch Card reveal', async () => {
    const gradient = { addColorStop: vi.fn() };
    const context = {
      beginPath: vi.fn(),
      clearRect: vi.fn(),
      createLinearGradient: vi.fn(() => gradient),
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
    const scratch = render(
      <ScratchCard height={120} result={{ prize: 'Gold' }} revealDuration={0} width={240}>
        Gold prize
      </ScratchCard>,
    );
    expect(scratch.container.querySelector('[data-jackpotkit-scratch-surface]')).not.toBeNull();
    expect(scratch.container.textContent).not.toContain('Lucky reveal');
    expect(gradient.addColorStop).toHaveBeenCalledTimes(4);
    fireEvent.click(screen.getByRole('button', { name: 'Reveal card' }));
    expect(await screen.findByText('Prize revealed')).toBeDefined();
  });

  it('keeps the visible Scratch Card path aligned with accumulated progress', async () => {
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
    const scratch = render(
      <ScratchCard autoReveal={false} height={120} result={{ prize: 'Gold' }} width={240}>
        Gold prize
      </ScratchCard>,
    );
    const canvas = scratch.container.querySelector<HTMLCanvasElement>(
      '[data-jackpotkit-scratch-canvas]',
    );
    expect(canvas).not.toBeNull();
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({ bottom: 120, height: 120, left: 0, right: 240, top: 0, width: 240 }),
    });
    Object.defineProperty(canvas, 'setPointerCapture', { value: vi.fn() });
    const initialStrokeCount = context.stroke.mock.calls.length;

    fireEvent.pointerDown(canvas as HTMLCanvasElement, { clientX: 30, clientY: 30, pointerId: 1 });
    await act(async () => Promise.resolve());
    fireEvent.pointerMove(canvas as HTMLCanvasElement, { clientX: 180, clientY: 85, pointerId: 1 });
    fireEvent.pointerUp(canvas as HTMLCanvasElement, { pointerId: 1 });

    expect(context.stroke).toHaveBeenCalledTimes(initialStrokeCount + 6);
    expect(context.clearRect).toHaveBeenCalledTimes(1);
    expect(scratch.container.querySelector('[role="status"]')?.textContent).not.toBe(
      '0% scratched',
    );
  });

  it('renders a D6 with pips and leaves its result upright', async () => {
    const dice = render(<Dice duration={0} faceStyle="pips" result={{ values: [5] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));

    expect(await screen.findByText('Total: 5')).toBeDefined();
    const face = screen.getByLabelText('D6: 5');
    expect(dice.container.querySelectorAll('[data-jackpotkit-die-pip]')).toHaveLength(5);
    expect(face.parentElement?.style.transform).toBe('');
  });

  it('uses native buttons for keyboard-operable Bingo cells', () => {
    const ref = createRef<BingoRef>();
    render(
      <Bingo
        board={[
          [1, 2, 3],
          [4, 'free', 5],
          [6, 7, 8],
        ]}
        maxNumber={9}
        patterns={['row']}
        ref={ref}
        size={3}
      />,
    );
    const cell = screen.getByRole('button', { name: 'Number 1, not called' });
    expect((cell as HTMLButtonElement).disabled).toBe(true);
    act(() => {
      ref.current?.call(1);
    });
    const calledCell = screen.getByRole('button', { name: 'Number 1, called' });
    expect((calledCell as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(calledCell);
    expect(screen.getByRole('button', { name: 'Number 1, called, marked' })).toBeDefined();
  });
});
