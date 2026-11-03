import { SeededRandomSource } from '@jackpotkit/core';
import { Bingo } from '@jackpotkit/react/bingo';
import { SpinWheel } from '@jackpotkit/react/spin-wheel';
import { useMemo } from 'react';

const segments = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
];

/** The same seed gives the same sequence of spins and the same Bingo card on every load. */
export function DesignReview({ seed }: { readonly seed: string }) {
  // Keep one source per seed: a new instance on every render would restart the sequence.
  const wheelRandom = useMemo(() => new SeededRandomSource(seed), [seed]);
  const bingoRandom = useMemo(() => new SeededRandomSource(`${seed}:bingo`), [seed]);
  return (
    <>
      <SpinWheel segments={segments} randomSource={wheelRandom} />
      <Bingo randomSource={bingoRandom} />
    </>
  );
}
