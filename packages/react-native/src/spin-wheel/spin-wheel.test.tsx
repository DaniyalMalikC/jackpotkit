import { neonTheme } from '@jackpotkit/theme';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { JackpotKitProvider } from '../theme-provider';
import { SpinWheel } from './spin-wheel';

const segments = [
  { color: '#7655D8', id: 'points', label: '100 points' },
  { color: '#E64B87', id: 'badge', label: 'Bonus badge' },
] as const;

describe('SpinWheel', () => {
  it('renders accessible segments and a disabled spin control', async () => {
    await render(<SpinWheel disabled segments={segments} size={240} />);

    expect(screen.getByRole('button', { name: 'Spin' })).toBeDisabled();
    expect(screen.getByText('100 points')).toBeVisible();
    expect(screen.getByText('Bonus badge')).toBeVisible();
  });

  it('animates to a controlled result and announces completion', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    const events: string[] = [];
    await render(
      <SpinWheel
        accessibilityLabels={{ result: (result) => `Winner: ${result.segment.label}` }}
        onComplete={onComplete}
        onEvent={(event) => events.push(event.type)}
        reduceMotion
        result={{ segmentId: 'badge' }}
        segments={segments}
        size={240}
      />,
    );

    await user.press(screen.getByRole('button', { name: 'Spin' }));

    expect(await screen.findByText('Winner: Bonus badge')).toBeVisible();
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ segmentId: 'badge' }));
    expect(events).toEqual([
      'ready',
      'play-start',
      'result-resolved',
      'animation-start',
      'reveal-start',
      'complete',
    ]);
  });

  it('uses provider themes and custom renderers without changing selection geometry', async () => {
    await render(
      <JackpotKitProvider theme={neonTheme}>
        <SpinWheel
          disabled
          renderPointer={() => <Text>Pointer</Text>}
          renderSegment={({ segment }) => <Text>{`Custom ${segment.id}`}</Text>}
          segments={segments}
          size={240}
        />
      </JackpotKitProvider>,
    );

    expect(screen.getByText('Pointer')).toBeVisible();
    expect(screen.getByText('Custom points')).toBeVisible();
    expect(screen.getByText('Custom badge')).toBeVisible();
  });

  it('fails with an actionable error for invalid animation configuration', async () => {
    await expect(render(<SpinWheel duration={-1} segments={segments} />)).rejects.toThrow(
      'duration must be a finite number at least 0',
    );
  });
});
