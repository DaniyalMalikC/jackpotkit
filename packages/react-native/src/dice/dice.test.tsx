import { fireEvent, render, screen } from '@testing-library/react-native';
import { act, createRef } from 'react';
import { Text } from 'react-native';

import { Dice } from './dice';
import type { DiceProps, DiceRef } from './types';

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
  // Regression: the default face carried a label without a role, which react-native-web emits as
  // a prohibited aria-label on a generic div. It is now an image, like the web renderer.
  it.each(['numbers', 'pips'] as const)(
    'exposes each default %s face as a labelled image',
    async (faceStyle) => {
      await render(
        <Dice count={2} faceStyle={faceStyle} reduceMotion result={{ values: [2, 6] }} />,
      );
      await act(async () => {
        fireEvent.press(screen.getByRole('button', { name: 'Roll dice' }));
        await Promise.resolve();
      });

      const faces = screen.getAllByRole('image');
      expect(faces).toHaveLength(2);
      expect(screen.getByRole('image', { name: 'D6: 2' })).toHaveProp('accessible', true);
      expect(screen.getByRole('image', { name: 'D6: 6' })).toBeVisible();
    },
  );

  // Type-level regression, enforced by `pnpm typecheck`: the Dice export lost its generic, so its
  // props resolved to DiceProps<unknown> and neither a DiceProps object nor a typed request fit.
  it('keeps generic props on the export', async () => {
    const props: DiceProps = { reduceMotion: true, result: { values: [2] } };
    await render(<Dice {...props} />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Roll dice'));
      await Promise.resolve();
    });
    expect(screen.getByText('Total: 2')).toBeVisible();

    await render(
      <Dice<{ readonly playId: string }>
        reduceMotion
        resultProvider={(request) => ({ values: [request.playId.length] })}
        resultRequest={{ playId: 'abc' }}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Roll dice'));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(await screen.findByText('Total: 3')).toBeVisible();
  });
});
