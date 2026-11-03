import type { GameStatus } from '@jackpotkit/core';
import { SpinWheel, type SpinWheelEvent } from '@jackpotkit/react/spin-wheel';

/** Your own analytics client. JackpotKit never sends data anywhere. */
declare function track(name: string, properties: Readonly<Record<string, unknown>>): void;

const segments = [
  { id: 'points', label: 'Points' },
  { id: 'badge', label: 'Badge' },
];

export function TrackedWheel({ campaignId }: { readonly campaignId: string }) {
  // #region events
  function onEvent(event: SpinWheelEvent) {
    // One callback for every lifecycle event: ready, play-start, result-resolved, complete, error...
    track(`spin_wheel.${event.type}`, { campaignId, timestamp: event.timestamp });
  }

  function onStatusChange(status: GameStatus) {
    if (status === 'error') track('spin_wheel.failed', { campaignId });
  }
  // #endregion events

  return (
    <SpinWheel
      segments={segments}
      onEvent={onEvent}
      onStatusChange={onStatusChange}
      onComplete={(result) =>
        track('spin_wheel.result_shown', { campaignId, segmentId: result.segmentId })
      }
    />
  );
}
