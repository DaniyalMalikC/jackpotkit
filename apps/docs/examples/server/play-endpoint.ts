// A framework-neutral server handler. Use it from a Next.js route handler, Express, Hono, or a
// serverless function. The client never chooses the outcome.
import type { RandomSource, WheelSegment } from '@jackpotkit/core';
import { createSpinWheel } from '@jackpotkit/core/spin-wheel';

// #region random
/** Cryptographically strong randomness for server-side draws. */
export class CryptoRandomSource implements RandomSource {
  next(): number {
    const [value = 0] = crypto.getRandomValues(new Uint32Array(1));
    return value / 2 ** 32;
  }
}
// #endregion random

// #region handler
/** Your persistence and eligibility layer. */
declare const store: {
  hasPlayedToday(userId: string, campaignId: string): Promise<boolean>;
  savePlay(play: {
    campaignId: string;
    playId: string;
    segmentId: string;
    userId: string;
  }): Promise<void>;
};

// Must match the client's segment IDs. Weights live only on the server.
const segments: readonly WheelSegment[] = [
  { id: 'points-100', weight: 10 },
  { id: 'badge', weight: 1 },
  { id: 'try-again', weight: 25 },
];

export async function handleSpin(userId: string, campaignId: string) {
  if (await store.hasPlayedToday(userId, campaignId)) {
    return { body: { error: 'already-played' }, status: 409 } as const;
  }
  const wheel = createSpinWheel({ randomSource: new CryptoRandomSource(), segments });
  const result = wheel.spin();
  const playId = crypto.randomUUID();
  // Persist before answering, so a refresh or replay cannot draw again.
  await store.savePlay({ campaignId, playId, segmentId: result.segmentId, userId });
  return { body: { playId, segmentId: result.segmentId }, status: 200 } as const;
}
// #endregion handler
