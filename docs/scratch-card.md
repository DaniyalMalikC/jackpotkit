---
title: Scratch Card
sidebar_position: 5
---

# Scratch Card

Scratch Card separates an already-selected prize from its visual reveal. Pure TypeScript owns result validation and deterministic coverage tracking; React Native Gesture Handler records strokes, Skia erases the cover, and Reanimated fades it away at the configured threshold.

## Installation

```bash
npm install @jackpotkit/react-native @jackpotkit/core @jackpotkit/theme @shopify/react-native-skia react-native-reanimated react-native-worklets react-native-gesture-handler
```

Expo projects should use Expo's resolver for native dependencies:

```bash
npx expo install @shopify/react-native-skia react-native-reanimated react-native-worklets react-native-gesture-handler
```

Skia is an optional peer and is intentionally absent from the package root. Import Scratch Card only from `@jackpotkit/react-native/scratch-card`.

## Basic example

```tsx
import { ScratchCard } from '@jackpotkit/react-native/scratch-card';

const selection = {
  prize: { id: 'points', label: '250 points' },
};

<ScratchCard
  width={320}
  height={180}
  result={selection}
  onComplete={(result) => saveResult(result.prize)}
>
  {(result) => <RewardCard prize={result?.prize} />}
</ScratchCard>;
```

The children are ordinary React Native content, not Skia nodes. They can include text, images, layout, and accessible controls appropriate for the revealed state.

## Headless engine

The core entrypoint has no React, native, Skia, DOM, or networking dependency:

```ts
import { createScratchCard } from '@jackpotkit/core/scratch-card';

const card = createScratchCard({
  threshold: 0.65,
  result: { prize: { id: 'points', amount: 250 } },
});

card.start();
card.scratch(0.4);
card.scratch(0.7); // { progress: 0.7, completed: true }
card.reset();
```

`scratch()` accepts a normalized progress value and keeps progress monotonic. `reveal()` explicitly completes the card. `startWith(provider, request)` resolves a synchronous or asynchronous consumer-supplied result and invalidates late results after reset.

Use `createScratchProgressTracker` when a custom renderer needs deterministic two-dimensional coverage:

```ts
import { createScratchProgressTracker } from '@jackpotkit/core/scratch-card';

const tracker = createScratchProgressTracker({
  width: 320,
  height: 180,
  brushRadius: 20,
});

tracker.scratchPoint({ x: 24, y: 40 });
const progress = tracker.scratchLine({ x: 24, y: 40 }, { x: 240, y: 40 });
```

Coverage is measured against a fixed grid rather than rendered pixels. That makes it repeatable across platforms and independent of frame rate, while remaining an estimate whose precision can be adjusted with `cellSize`.

## Server-authoritative prize

```tsx
const resultProvider = async () => {
  const response = await api.requestScratchPrize();
  return {
    prize: response.prize,
    metadata: { playId: response.playId },
  };
};

<ScratchCard
  width={320}
  height={180}
  resultProvider={resultProvider}
  onComplete={(result) => acknowledge(result.metadata?.playId)}
>
  {(result) => <RewardCard prize={result?.prize} />}
</ScratchCard>;
```

Scratching may continue while the result is requested. Reaching the threshold cannot invent a prize: completion waits for the validated provider result. The application owns networking, authentication, authorization, idempotency, persistence, replay protection, and fulfilment. See [Server-authoritative results](./server-authoritative-results.md).

## Covers

The default is a theme-aware solid cover. It can be configured directly:

```tsx
<ScratchCard cover={{ type: 'solid', color: '#A7A9B5' }} {...props} />

<ScratchCard
  cover={{ type: 'image', source: require('./scratch-cover.png'), fit: 'cover' }}
  {...props}
/>
```

For a custom Skia cover, return Skia drawing nodes from `renderCover`:

```tsx
<ScratchCard
  renderCover={({ width, height, theme }) => (
    <RoundedRect
      x={0}
      y={0}
      width={width}
      height={height}
      r={theme.radii.md}
      color={theme.colors.scratchAccent}
    />
  )}
  {...props}
/>
```

The scratch path is applied with the `clear` blend mode to the isolated cover layer. It never mutates the hidden React Native reward content.

## Hook and imperative API

```tsx
const { status, progress, result, error, begin, scratch, reveal, reset } = useScratchCard({
  resultProvider,
});
```

`useScratchCard` supports custom renderers. Its `scratch(progress)` accepts normalized coverage supplied by that renderer.

```tsx
const ref = useRef<ScratchCardRef<Prize>>(null);

<ScratchCard ref={ref} autoReveal={false} {...props} />;

await ref.current?.reveal();
ref.current?.reset();
```

With `autoReveal={false}`, threshold completion leaves the cover visible until `reveal()` is called. Completion callbacks are emitted at most once per reset.

## Component API

| Prop                                           | Purpose                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `width`, `height`                              | Required positive card dimensions.                                                  |
| `children`                                     | Hidden React Native content or a render function receiving the current result.      |
| `result`                                       | Controlled `{ prize, metadata }` selection.                                         |
| `resultProvider` / `resultRequest`             | Application-supplied synchronous or asynchronous selection.                         |
| `threshold`                                    | Completion coverage in `(0, 1]`; defaults to `0.65`.                                |
| `brushRadius`                                  | Positive scratch radius in layout points; defaults to `18`.                         |
| `cover`                                        | Theme-aware solid or image cover.                                                   |
| `renderCover`                                  | Custom Skia cover drawing.                                                          |
| `autoReveal`, `revealDuration`, `reduceMotion` | Visual reveal controls.                                                             |
| `disabled`, `status`                           | Disable interaction or present external status.                                     |
| `theme`, `borderRadius`, `style`               | Presentation overrides.                                                             |
| `accessibilityLabel`, `accessibilityLabels`    | Override card, action, progress, disabled, and result copy.                         |
| Lifecycle callbacks / `onEvent`                | Ready, play, request, resolve, progress, reveal, complete, reset, and error events. |

## Accessibility and motion

- The card exposes a button role, busy and disabled state, scratch percentage, and an accessibility action that reveals without a gesture.
- Completion announces the consumer-provided result label. Override it when the prize has meaningful copy.
- `reduceMotion` uses a short transition; when omitted, the system reduced-motion preference is honored.
- Custom covers and hidden content remain the application's responsibility for contrast, legibility, focus order, and non-color-only meaning.

## Expo web

Skia's CanvasKit runtime must load asynchronously on web. Keep the loader outside the Expo Router `app/` directory and use a platform-specific component:

```tsx
// components/scratch-card-route-content.web.tsx
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

export default function ScratchCardRouteContent() {
  if (typeof window === 'undefined') return <LoadingCard />;

  return (
    <WithSkiaWeb
      fallback={<LoadingCard />}
      getComponent={() => import('./scratch-card-playground')}
    />
  );
}
```

The server guard preserves static rendering, and the dynamic import keeps CanvasKit and Scratch Card code out of unrelated web routes.

## Testing

`@jackpotkit/testing` provides `createScratchCardSelection(prize, { metadata })`. Prefer direct progress values for headless hook tests and Gesture Handler's Jest utilities for component gestures; do not rely on pixel snapshots to decide whether a threshold was reached.

The Expo gallery includes an interactive playground for result mode, threshold, brush radius, covers, themes, auto reveal, reduced motion, reset, and explicit reveal.
