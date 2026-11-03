import type { SpinWheelSelection, WheelSegment } from '@jackpotkit/core';
import { SpinWheel } from '@jackpotkit/react/spin-wheel';
import { useState } from 'react';

const segments: readonly WheelSegment[] = [
  { id: 'points-100', label: '100 points' },
  { id: 'badge', label: 'Bonus badge' },
  { id: 'try-again', label: 'Try again' },
];

interface PlayRequest {
  readonly campaignId: string;
}

interface PlayResponse {
  readonly playId: string;
  readonly segmentId: string;
}

// The server validates eligibility, chooses and stores the outcome, and returns its segment ID.
async function requestSpin({ campaignId }: PlayRequest): Promise<SpinWheelSelection> {
  const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/spin`, {
    credentials: 'include',
    method: 'POST',
  });
  if (!response.ok) throw new Error(`Spin request failed with ${response.status}`);
  const play = (await response.json()) as PlayResponse;
  return { segmentId: play.segmentId };
}

export function CampaignWheel({ campaignId }: { readonly campaignId: string }) {
  const [message, setMessage] = useState('');

  return (
    <>
      <SpinWheel<unknown, PlayRequest>
        segments={segments}
        resultProvider={requestSpin}
        resultRequest={{ campaignId }}
        // Presentation only: the server already stored the outcome before it answered.
        onComplete={(result) => setMessage(`You won: ${result.segment.label ?? result.segmentId}`)}
        // Provider failures arrive as ResultProviderError; the wheel did not spin.
        onError={() => setMessage('We could not start your spin. Please try again.')}
      />
      <p role="status">{message}</p>
    </>
  );
}
