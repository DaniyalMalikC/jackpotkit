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

  // Regression: the surface button was named "Scratch Card. N percent scratched." while it
  // contained the prize content, so its name did not include its text (WCAG 2.5.3). The cover is
  // now the button, progress is its value, and the prize stays hidden until the reveal.
  it('names the cover without exposing the prize before the reveal', async () => {
    const onComplete = jest.fn();
    await render(
      <ScratchCard
        brushRadius={24}
        height={80}
        onComplete={onComplete}
        reduceMotion
        result={{ prize: 'bonus' }}
        threshold={0.9}
        width={160}
      >
        {(result) => <Text>{result?.prize ?? 'Hidden reward'}</Text>}
      </ScratchCard>,
    );

    const surface = screen.getByRole('button', { name: 'Scratch Card' });
    expect(surface).toBe(screen.getByTestId('jackpotkit-scratch-card'));
    expect(surface).toHaveProp('accessible', true);
    expect(surface).toHaveProp('accessibilityValue', { text: '0 percent scratched' });
    expect(surface).toHaveProp('accessibilityHint', 'Reveal Scratch Card');
    expect(surface).not.toHaveTextContent(/Hidden reward/);
    expect(screen.queryByText('Hidden reward')).toBeNull();
    expect(screen.getByText('Hidden reward', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByLabelText(/percent scratched/)).toBeNull();

    await act(async () => {
      fireGestureHandler(getByGestureTestId('jackpotkit-scratch-gesture'), [
        { state: State.BEGAN, x: 10, y: 40 },
        { state: State.ACTIVE, x: 60, y: 40 },
        { state: State.END, x: 60, y: 40 },
      ]);
      await Promise.resolve();
    });
    const scratched = screen.getByRole('button', { name: 'Scratch Card' });
    expect(scratched.props.accessibilityValue.text).toMatch(/^[1-9]\d? percent scratched$/);
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.queryByText(/bonus|Hidden reward/)).toBeNull();

    await act(async () => {
      fireEvent(scratched, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
      await Promise.resolve();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText('bonus')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Scratch Card' })).toBeDisabled();
  });

  it('exposes the content once the threshold completes without auto reveal', async () => {
    await render(
      <ScratchCard
        autoReveal={false}
        brushRadius={24}
        height={80}
        reduceMotion
        result={{ prize: 'manual' }}
        threshold={0.01}
        width={160}
      >
        <Text>Manual reward</Text>
      </ScratchCard>,
    );
    expect(screen.queryByText('Manual reward')).toBeNull();

    await act(async () => {
      fireGestureHandler(getByGestureTestId('jackpotkit-scratch-gesture'), [
        { state: State.BEGAN, x: 10, y: 40 },
        { state: State.ACTIVE, x: 150, y: 40 },
        { state: State.END, x: 150, y: 40 },
      ]);
      await Promise.resolve();
    });
    expect(screen.getByText('Manual reward')).toBeVisible();
  });

  it('keeps consumer accessibility label overrides', async () => {
    await render(
      <ScratchCard
        accessibilityLabels={{
          card: 'Mystery ticket',
          disabled: 'Ticket unavailable',
          progress: (progress) => `${Math.round(progress * 100)}% uncovered`,
          reveal: 'Uncover ticket',
        }}
        disabled
        height={80}
        result={{ prize: 'badge' }}
        width={160}
      >
        <Text>Badge</Text>
      </ScratchCard>,
    );

    const surface = screen.getByRole('button', { name: 'Mystery ticket' });
    expect(surface).toBeDisabled();
    expect(surface).toHaveProp('accessibilityValue', { text: '0% uncovered' });
    expect(surface).toHaveProp('accessibilityHint', 'Ticket unavailable');
    expect(surface).toHaveProp('accessibilityActions', [
      { name: 'activate', label: 'Uncover ticket' },
    ]);
  });

  it('uses accessibilityLabel when no card label override is given', async () => {
    await render(
      <ScratchCard accessibilityLabel="Daily card" height={80} width={160}>
        <Text>Prize</Text>
      </ScratchCard>,
    );
    expect(screen.getByRole('button', { name: 'Daily card' })).toBeTruthy();
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
