import { fireEvent, render, screen } from '@testing-library/react-native';
import { act, createRef } from 'react';
import { Text } from 'react-native';

import { Bingo } from './bingo';
import type { BingoCellRenderInfo, BingoRef } from './types';
import { assertBingoComponentConfiguration } from './validation';

const board = [
  [1, 4, 7],
  [2, 'free', 8],
  [3, 6, 9],
] as const;

describe('Bingo', () => {
  it('renders an accessible board and marks called cells', async () => {
    const reference = createRef<BingoRef>();
    await render(<Bingo board={board} maxNumber={9} reduceMotion ref={reference} size={3} />);

    expect(screen.getByLabelText('Free space, marked')).toBeDisabled();
    expect(screen.getByLabelText('Number 1, not called')).toBeDisabled();

    await act(async () => reference.current?.call(1));
    await act(async () => fireEvent.press(screen.getByLabelText('Number 1, called')));
    expect(screen.getByLabelText('Number 1, called, marked')).toHaveProp('accessibilityState', {
      checked: true,
      disabled: false,
    });
  });

  it('supports custom cells and announces a completed pattern', async () => {
    const reference = createRef<BingoRef>();
    const onComplete = jest.fn();
    const renderCell = jest.fn(({ value, marked }: BingoCellRenderInfo) => (
      <Text>{`${value}:${marked ? 'yes' : 'no'}`}</Text>
    ));
    await render(
      <Bingo
        board={board}
        maxNumber={9}
        onComplete={onComplete}
        reduceMotion
        ref={reference}
        renderCell={renderCell}
        size={3}
      />,
    );

    await act(async () => {
      for (const number of [1, 4, 7]) {
        reference.current?.call(number);
        reference.current?.mark(number);
      }
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Bingo! Completed Row 1/)).toBeVisible();
    expect(renderCell).toHaveBeenCalledWith(expect.objectContaining({ value: 1, marked: true }));
  });

  it('supports random calls and validates presentation geometry', async () => {
    await render(<Bingo board={board} maxNumber={9} randomSource={{ next: () => 0 }} size={3} />);
    await act(async () => fireEvent.press(screen.getByLabelText('Call next Bingo number')));
    expect(await screen.findByText('Last call: 1')).toBeVisible();
    expect(() => assertBingoComponentConfiguration(0)).toThrow('width must be a positive');
    expect(() => assertBingoComponentConfiguration(300, -1)).toThrow(
      'cellGap must be a non-negative',
    );
  });
});
