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

    const coin = render(<CoinFlip duration={0} result={{ faceId: 'heads' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Flip coin' }));
    expect(await screen.findByText('Result: Heads')).toBeDefined();
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

    render(
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
  });

  it('supports an accessible manual Scratch Card reveal', async () => {
    const context = {
      beginPath: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      stroke: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    render(
      <ScratchCard height={120} result={{ prize: 'Gold' }} revealDuration={0} width={240}>
        Gold prize
      </ScratchCard>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reveal card' }));
    expect(await screen.findByText('Prize revealed')).toBeDefined();
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
