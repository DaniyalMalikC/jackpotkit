import { fireEvent, render, screen } from '@testing-library/react-native';
import { defaultTheme } from '@jackpotkit/theme';
import { act, createRef } from 'react';
import { Text } from 'react-native';

import { SlotMachine } from './slot-machine';
import type { SlotMachineRef, SlotSymbolRenderInfo } from './types';
import { assertSlotMachineComponentConfiguration } from './validation';

const symbols = [
  { id: 'cherry', label: '🍒' },
  { id: 'star', label: '⭐' },
];
const selection = {
  reels: [
    ['star', 'cherry'],
    ['star', 'cherry'],
    ['star', 'cherry'],
  ],
};

describe('SlotMachine', () => {
  it('animates a controlled grid, stops every reel and completes once', async () => {
    const onComplete = jest.fn();
    const onReelStop = jest.fn();
    await render(
      <SlotMachine
        onComplete={onComplete}
        onReelStop={onReelStop}
        reduceMotion
        reelCount={3}
        result={selection}
        rowCount={2}
        symbols={symbols}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Spin reels'));
      await Promise.resolve();
    });
    expect(onReelStop).toHaveBeenCalledTimes(3);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('2 winning paylines.')).toBeVisible();
  });

  it('supports custom symbol rendering and imperative destinations', async () => {
    const reference = createRef<SlotMachineRef>();
    const renderSymbol = jest.fn(({ symbol, winning }: SlotSymbolRenderInfo) => (
      <Text>{winning ? `WIN ${symbol.id}` : symbol.id}</Text>
    ));
    await render(
      <SlotMachine
        reduceMotion
        reelCount={3}
        ref={reference}
        renderSymbol={renderSymbol}
        rowCount={2}
        symbols={symbols}
      />,
    );

    let playPromise: Promise<unknown> | undefined;
    await act(async () => {
      playPromise = reference.current?.spinTo(selection);
      await Promise.resolve();
    });
    await expect(playPromise).resolves.toMatchObject({ game: 'slot-machine' });
    expect(renderSymbol).toHaveBeenCalledWith(expect.objectContaining({ winning: true }));

    await act(() => reference.current?.reset());
    expect(screen.getByLabelText('Spin reels')).not.toBeDisabled();
  });

  it('rejects invalid presentation geometry', () => {
    expect(() =>
      assertSlotMachineComponentConfiguration({ reelCount: 3, symbols, width: 0 }, defaultTheme),
    ).toThrow('width must be a positive finite number');
  });
});
