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
  it('selects independently from a controlled winning box', async () => {
    const onComplete = jest.fn();
    await render(
      <LuckyBox boxes={boxes} onComplete={onComplete} reduceMotion result={{ boxId: 'one' }} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Box one'));
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Reveal Lucky Box'));
      await Promise.resolve();
    });
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ won: true }));
    expect(screen.getByText('You found the winning box!')).toBeVisible();
    expect(screen.getByLabelText('Box three')).toBeDisabled();
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
});
