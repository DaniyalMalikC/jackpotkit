import { fireEvent, render, screen } from '@testing-library/react-native';
import { act, createRef } from 'react';
import { Text } from 'react-native';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { ScratchCard } from './scratch-card';
import type { ScratchCardRef } from './types';

describe('ScratchCard', () => {
  it('converts gestures into progress and one completion per cycle', async () => {
    const onComplete = jest.fn();
    const onProgress = jest.fn();
    await render(
      <ScratchCard
        brushRadius={24}
        height={80}
        onComplete={onComplete}
        onProgress={onProgress}
        reduceMotion
        result={{ prize: 'bonus' }}
        threshold={0.01}
        width={160}
      >
        {(result) => <Text>{result?.prize ?? 'Loading'}</Text>}
      </ScratchCard>,
    );

    await act(async () => {
      fireGestureHandler(getByGestureTestId('jackpotkit-scratch-gesture'), [
        { state: State.BEGAN, x: 10, y: 40 },
        { state: State.ACTIVE, x: 150, y: 40 },
        { state: State.END, x: 150, y: 40 },
      ]);
      await Promise.resolve();
    });

    expect(onProgress).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('bonus')).toBeVisible();
  });

  it('supports the accessibility reveal action and imperative reset', async () => {
    const reference = createRef<ScratchCardRef<string>>();
    const onComplete = jest.fn();
    await render(
      <ScratchCard
        accessibilityLabels={{ result: (result) => `Revealed ${result.prize}` }}
        height={80}
        onComplete={onComplete}
        reduceMotion
        ref={reference}
        result={{ prize: 'badge' }}
        width={160}
      >
        <Text>Hidden reward</Text>
      </ScratchCard>,
    );

    await act(async () => {
      fireEvent(screen.getByTestId('jackpotkit-scratch-card'), 'accessibilityAction', {
        nativeEvent: { actionName: 'activate' },
      });
      await Promise.resolve();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    await act(() => reference.current?.reset());
    expect(screen.getByTestId('jackpotkit-scratch-card')).not.toBeDisabled();
  });

  it('returns to completed after manually revealing a threshold-complete card', async () => {
    const reference = createRef<ScratchCardRef<string>>();
    const onComplete = jest.fn();
    const onStatusChange = jest.fn();
    await render(
      <ScratchCard
        autoReveal={false}
        brushRadius={24}
        height={80}
        onComplete={onComplete}
        onStatusChange={onStatusChange}
        reduceMotion
        ref={reference}
        result={{ prize: 'manual' }}
        threshold={0.01}
        width={160}
      >
        <Text>Manual reward</Text>
      </ScratchCard>,
    );

    await act(async () => {
      fireGestureHandler(getByGestureTestId('jackpotkit-scratch-gesture'), [
        { state: State.BEGAN, x: 10, y: 40 },
        { state: State.ACTIVE, x: 150, y: 40 },
        { state: State.END, x: 150, y: 40 },
      ]);
      await Promise.resolve();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    await act(async () => {
      await reference.current?.reveal();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenLastCalledWith('completed');
  });

  it('renders custom covers and rejects invalid geometry', async () => {
    await render(
      <ScratchCard disabled height={80} renderCover={() => <Text>Custom cover</Text>} width={160}>
        <Text>Reward</Text>
      </ScratchCard>,
    );
    expect(screen.getByText('Custom cover')).toBeVisible();

    await expect(
      render(
        <ScratchCard height={0} width={160}>
          <Text>Invalid</Text>
        </ScratchCard>,
      ),
    ).rejects.toThrow('height must be a positive finite number');
  });
});
