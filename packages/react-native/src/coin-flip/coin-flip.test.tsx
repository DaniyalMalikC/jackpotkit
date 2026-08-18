import { fireEvent, render, screen } from '@testing-library/react-native';
import { act, createRef } from 'react';
import { Text } from 'react-native';

import { CoinFlip } from './coin-flip';
import type { CoinFlipRef } from './types';

describe('CoinFlip', () => {
  it('animates a controlled face and completes once', async () => {
    const onComplete = jest.fn();
    await render(<CoinFlip onComplete={onComplete} reduceMotion result={{ faceId: 'tails' }} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Flip coin'));
      await Promise.resolve();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Result: Tails')).toBeVisible();
  });

  it('supports custom faces and imperative destinations', async () => {
    const reference = createRef<CoinFlipRef<number>>();
    const faces = [
      { id: 'yes', value: 1 },
      { id: 'no', value: 0 },
    ];
    await render(
      <CoinFlip
        faces={faces}
        reduceMotion
        ref={reference}
        renderFace={({ face }) => <Text>Face {face.id}</Text>}
      />,
    );
    let result: Promise<unknown> | undefined;
    await act(async () => {
      result = reference.current?.flipTo({ faceId: 'no' });
      await Promise.resolve();
    });
    await expect(result).resolves.toMatchObject({ faceId: 'no' });
    act(() => reference.current?.reset());
  });

  it('renders a two-sided embossed coin and lands on the controlled face', async () => {
    await render(
      <CoinFlip faceStyle="embossed" reduceMotion result={{ faceId: 'tails' }} size={140} />,
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Flip coin'));
      await Promise.resolve();
    });

    expect(screen.getByLabelText('Coin face: Tails')).toBeVisible();
    expect(
      screen.getAllByTestId('jackpotkit-coin-rim', { includeHiddenElements: true }),
    ).toHaveLength(2);
    expect(screen.getByText('Result: Tails')).toBeVisible();
  });
});
