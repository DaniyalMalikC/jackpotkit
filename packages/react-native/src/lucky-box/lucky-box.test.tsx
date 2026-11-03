import { fireEvent, render, screen } from '@testing-library/react-native';
import { act, createRef } from 'react';
import { Text } from 'react-native';

import { LuckyBox } from './lucky-box';
import type { LuckyBoxRef } from './types';

const boxes = [
  { id: 'one', label: 'Box one', reward: 'Badge' },
  { id: 'two', label: 'Box two' },
  { id: 'three', label: 'Box three', disabled: true },
];

describe('LuckyBox', () => {
  it('keeps graphical selection transforms valid when selection is cleared', async () => {
    const reference = createRef<LuckyBoxRef<string>>();
    await render(<LuckyBox boxes={boxes} faceStyle="gift-boxes" ref={reference} />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Box one'));
      await Promise.resolve();
    });
    expect(screen.getByTestId('jackpotkit-lucky-gift-visual-Box one')).toHaveStyle({
      transform: [{ translateY: -3 }],
    });

    await act(async () => {
      reference.current?.reset();
      await Promise.resolve();
    });
    expect(screen.getByTestId('jackpotkit-lucky-gift-visual-Box one')).toHaveStyle({
      transform: [{ translateY: 0 }],
    });
  });

  it('selects independently from a controlled winning box', async () => {
    const onComplete = jest.fn();
    await render(
      <LuckyBox
        boxes={boxes}
        faceStyle="gift-boxes"
        onComplete={onComplete}
        reduceMotion
        result={{ boxId: 'one' }}
      />,
    );
    expect(screen.getAllByTestId('jackpotkit-lucky-gift')).toHaveLength(3);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Box one'));
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Reveal selection' }));
      await Promise.resolve();
    });
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ won: true }));
    expect(screen.getByText('You found the winning box!')).toBeVisible();
    expect(screen.getByTestId('jackpotkit-lucky-gift-lid-Box one')).toBeVisible();
    expect(screen.getByLabelText('Box three, unavailable')).toBeDisabled();
  });

  it('supports custom boxes and imperative picks', async () => {
    const reference = createRef<LuckyBoxRef<string>>();
    await render(
      <LuckyBox
        boxes={boxes}
        reduceMotion
        ref={reference}
        renderBox={({ box }) => <Text>Custom {box.id}</Text>}
      />,
    );
    let result: Promise<unknown> | undefined;
    await act(async () => {
      result = reference.current?.pick('two');
      await Promise.resolve();
    });
    await expect(result).resolves.toMatchObject({ selectedBox: { id: 'two' } });
    act(() => reference.current?.reset());
  });

  // Regression: default names differed from the visible text of the reveal button and of
  // unavailable boxes (WCAG 2.5.3).
  it.each(['tiles', 'gift-boxes'] as const)(
    'names %s controls starting with their visible text',
    async (faceStyle) => {
      await render(
        <LuckyBox boxes={boxes} faceStyle={faceStyle} reduceMotion result={{ boxId: 'two' }} />,
      );

      expect(screen.getByRole('button', { name: 'Reveal selection' })).toHaveTextContent(
        'Reveal selection',
      );
      expect(screen.queryByLabelText('Reveal Lucky Box')).toBeNull();
      const unavailable = screen.getByRole('button', { name: 'Box three, unavailable' });
      expect(unavailable).toBeDisabled();
      expect(unavailable).toHaveTextContent(/Box three · unavailable$/);

      await act(async () => {
        fireEvent.press(screen.getByRole('button', { name: 'Box one' }));
        await Promise.resolve();
      });
      expect(screen.getByRole('button', { name: 'Box one, selected' })).toHaveTextContent(
        /Box one$/,
      );
      await act(async () => {
        fireEvent.press(screen.getByRole('button', { name: 'Reveal selection' }));
        await Promise.resolve();
      });
      expect(screen.getByRole('button', { name: 'Box two, winning box' })).toHaveTextContent(
        /★ Box two$/,
      );
    },
  );
});
