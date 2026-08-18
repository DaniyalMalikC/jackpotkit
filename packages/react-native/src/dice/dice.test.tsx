import { fireEvent, render, screen } from '@testing-library/react-native';
import { act, createRef } from 'react';
import { Text } from 'react-native';

import { Dice } from './dice';
import type { DiceRef } from './types';

describe('Dice', () => {
  it('animates an exact result and announces the total', async () => {
    const onComplete = jest.fn();
    await render(
      <Dice count={2} onComplete={onComplete} reduceMotion result={{ values: [3, 5] }} />,
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Roll dice'));
      await Promise.resolve();
    });

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ total: 8 }));
    expect(screen.getByText('Total: 8')).toBeVisible();
  });

  it('supports custom dice and imperative rolls', async () => {
    const reference = createRef<DiceRef>();
    const renderDie = jest.fn(({ value }: { value: number }) => <Text>Value {value}</Text>);
    await render(<Dice count={2} reduceMotion ref={reference} renderDie={renderDie} />);

    let result: Promise<unknown> | undefined;
    await act(async () => {
      result = reference.current?.rollTo({ values: [2, 4] });
      await Promise.resolve();
    });
    await expect(result).resolves.toMatchObject({ values: [2, 4] });
    expect(renderDie).toHaveBeenCalled();
    act(() => reference.current?.reset());
  });

  it('renders conventional pips for a D6', async () => {
    await render(<Dice faceStyle="pips" reduceMotion result={{ values: [5] }} />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Roll dice'));
      await Promise.resolve();
    });

    expect(screen.getByLabelText('D6: 5')).toBeVisible();
    expect(
      screen.getAllByTestId('jackpotkit-die-pip', { includeHiddenElements: true }),
    ).toHaveLength(5);
    expect(screen.getByText('Total: 5')).toBeVisible();
  });
});
