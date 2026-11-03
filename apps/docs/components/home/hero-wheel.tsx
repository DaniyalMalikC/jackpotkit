'use client';

import { SpinWheel } from '@jackpotkit/react/spin-wheel';
import { useState } from 'react';

import { useIsClient } from '@/components/use-client';
import { useDemoTheme } from '@/components/use-demo-theme';

const segments = [
  { id: 'points', label: '100 points' },
  { id: 'badge', label: 'Badge' },
  { id: 'bonus', label: 'Bonus' },
  { id: 'streak', label: 'Streak' },
  { id: 'sticker', label: 'Sticker' },
  { id: 'retry', label: 'Try again' },
];

const WHEEL_SIZE = 260;

/** The homepage preview: the published `@jackpotkit/react` Spin Wheel with no wrappers. */
export function HeroWheel() {
  const isClient = useIsClient();
  const theme = useDemoTheme();
  const [lastSegmentId, setLastSegmentId] = useState<string>();

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="flex items-center justify-center"
        style={{ minHeight: WHEEL_SIZE + 110, minWidth: WHEEL_SIZE }}
      >
        {isClient ? (
          <SpinWheel
            accessibilityLabel="JackpotKit Spin Wheel preview"
            onComplete={(result) => setLastSegmentId(result.segmentId)}
            onReset={() => setLastSegmentId(undefined)}
            segments={segments}
            size={WHEEL_SIZE}
            theme={theme}
          />
        ) : (
          <div
            aria-hidden="true"
            className="rounded-full border-4 border-dashed border-fd-border"
            style={{ height: WHEEL_SIZE, width: WHEEL_SIZE }}
          />
        )}
      </div>
      <p className="font-mono text-xs text-fd-muted-foreground" data-testid="hero-result">
        {lastSegmentId === undefined
          ? 'onComplete → waiting for a spin'
          : `onComplete → { segmentId: '${lastSegmentId}' }`}
      </p>
    </div>
  );
}
