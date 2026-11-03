import type { WheelSegment } from '@jackpotkit/core';
import { SpinWheel } from '@jackpotkit/react/spin-wheel';
import { useState } from 'react';

const segments: readonly WheelSegment<number>[] = [
  { id: 'points-50', label: '50 points', value: 50 },
  { id: 'points-100', label: '100 points', value: 100, weight: 2 },
  { id: 'badge', label: 'Bonus badge', value: 0 },
  { id: 'try-again', label: 'Try again', value: 0, weight: 3 },
];

export function DailySpin() {
  const [message, setMessage] = useState('Spin once a day.');

  return (
    <section>
      <SpinWheel
        segments={segments}
        size={320}
        onComplete={(result) =>
          setMessage(`You landed on ${result.segment.label ?? result.segmentId}.`)
        }
        onError={() => setMessage('Something went wrong. Try again.')}
      />
      <p>{message}</p>
    </section>
  );
}
