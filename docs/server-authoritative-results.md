---
title: Server-authoritative results
sidebar_position: 5
---

# Server-authoritative results

Client-side outcomes can be inspected or manipulated. Applications must not trust client randomness for valuable, security-sensitive, or eligibility-controlled rewards.

The intended data flow is:

```text
UI requests play
    ↓
Backend validates eligibility
    ↓
Backend calculates and persists the result
    ↓
Backend returns the result
    ↓
JackpotKit validates and renders that result
```

Networking does not belong inside JackpotKit. A consumer supplies a result provider, while the component handles requesting, validation, lifecycle state, and animation toward the supplied destination.

```ts
import { resolveResult, type GameResult, type ResultProvider } from '@jackpotkit/core';

type PlayRequest = { campaignId: string };
type PlayData = { rewardId: string };

const requestResult: ResultProvider<PlayRequest, GameResult<PlayData>> = async ({ campaignId }) => {
  const response = await fetch(`/api/campaigns/${campaignId}/play`, { method: 'POST' });

  if (!response.ok) throw new Error('The play request failed');
  return response.json() as Promise<GameResult<PlayData>>;
};

const result = await resolveResult(requestResult, { campaignId: 'summer-2026' });
```

`resolveResult` accepts synchronous and asynchronous providers. Unknown provider failures are normalized to `ResultProviderError` and retain the original error as `cause`. Applications still own authentication, authorization, replay protection, transport validation, and server-side persistence.

Spin Wheel consumes the same boundary directly:

```tsx
const resultProvider = async () => {
  const response = await api.requestSpin();
  return { segmentId: response.segmentId };
};

<SpinWheel segments={segments} resultProvider={resultProvider} />;
```

The component enters `requesting-result`, validates the returned segment ID, calculates the exact destination, and only then starts animation.

Built-in random sources are intended for demonstrations, ordinary gamification, reproducible testing, and debugging. They are not represented as cryptographically secure, certified, regulator-approved, or inherently fair.
