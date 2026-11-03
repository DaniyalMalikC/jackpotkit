'use client';

// app/daily-spin.tsx in a Next.js App Router project. Interactive games are client components;
// the exact subpath import is SSR-safe, so this file can also be rendered on the server.
import type { WheelSegment } from '@jackpotkit/core';
import { SpinWheel } from '@jackpotkit/react/spin-wheel';

const segments: readonly WheelSegment[] = [
  { id: 'gold', label: 'Gold' },
  { id: 'silver', label: 'Silver' },
  { id: 'bronze', label: 'Bronze' },
];

export default function DailySpin() {
  return <SpinWheel segments={segments} />;
}
