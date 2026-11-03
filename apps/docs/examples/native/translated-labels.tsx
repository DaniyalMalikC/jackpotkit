import type { WheelSegment } from '@jackpotkit/core';
import { SpinWheel } from '@jackpotkit/react-native/spin-wheel';

/** Your i18n library's translate function. */
declare function t(key: string, values?: Readonly<Record<string, string>>): string;

export function TranslatedWheel() {
  const segments: readonly WheelSegment[] = [
    { id: 'points', label: t('rewards.points', { amount: '100' }) },
    { id: 'badge', label: t('rewards.badge') },
  ];
  return (
    <SpinWheel
      segments={segments}
      accessibilityLabels={{
        wheel: t('games.dailyWheel'),
        spin: t('games.spin'),
        spinning: t('games.spinning'),
        result: (result) => t('games.youWon', { prize: result.segment.label ?? result.segmentId }),
      }}
    />
  );
}
