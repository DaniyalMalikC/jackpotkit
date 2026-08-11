import type { CoinFace } from '@jackpotkit/core';

export function createCoinFaces<TValue = string>(
  values?: readonly [TValue, TValue],
): readonly [CoinFace<TValue>, CoinFace<TValue>] {
  const resolvedValues = values ?? (['heads', 'tails'] as unknown as readonly [TValue, TValue]);
  return Object.freeze([
    Object.freeze({ id: 'heads', label: 'Heads', value: resolvedValues[0] }),
    Object.freeze({ id: 'tails', label: 'Tails', value: resolvedValues[1] }),
  ]);
}
