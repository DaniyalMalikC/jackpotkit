import type { WheelSegment } from '@jackpotkit/core';
import { SpinWheel } from '@jackpotkit/react/spin-wheel';

/** Your i18n library's translate function. */
declare function t(key: string, values?: Readonly<Record<string, string>>): string;

// Segment labels are visible text and the announced result, so translate them in your data.
export function TranslatedWheel() {
  const segments: readonly WheelSegment[] = [
    { id: 'points', label: t('rewards.points', { amount: '100' }) },
    { id: 'badge', label: t('rewards.badge') },
  ];
  return <SpinWheel accessibilityLabel={t('games.dailyWheel')} segments={segments} />;
}
