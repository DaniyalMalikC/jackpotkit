---
title: Spin Wheel
sidebar_position: 4
---

# Spin Wheel

Spin Wheel is JackpotKit's end-to-end reference game. Result selection lives in pure TypeScript; the React Native component resolves and validates the winner before calculating an exact Reanimated destination.

Probability weights never change visual geometry. The prebuilt renderer always gives configured segments equal physical slices.

## Installation

```bash
npm install @jackpotkit/react-native @jackpotkit/core @jackpotkit/theme react-native-reanimated react-native-worklets react-native-gesture-handler react-native-svg
```

Expo users should install native peers with Expo's resolver:

```bash
npx expo install react-native-reanimated react-native-worklets react-native-svg
```

## Basic example

```tsx
import { SpinWheel } from '@jackpotkit/react-native/spin-wheel';

const segments = [
  { id: 'points', label: '100 points', value: 100, color: '#6843D5', weight: 4 },
  { id: 'badge', label: 'Bonus badge', value: 'badge', color: '#EB4D8A', weight: 1 },
];

<SpinWheel segments={segments} onComplete={(result) => saveResult(result.segmentId)} />;
```

## Headless API

The engine has no React, React Native, Expo, DOM, or animation dependency:

```ts
import { SeededRandomSource } from '@jackpotkit/core';
import { createSpinWheel } from '@jackpotkit/core/spin-wheel';

const wheel = createSpinWheel({
  segments,
  randomSource: new SeededRandomSource('demo-seed'),
});

wheel.spin();
wheel.spinTo('badge');
await wheel.spinWith(resultProvider, request);
wheel.reset();
```

The engine validates empty segment collections, blank or duplicate IDs, non-positive or non-finite weights, non-finite total weight, and unknown supplied results. Results compose the common `GameResult` contract and expose `segmentId` and the selected immutable segment directly.

## Controlled result

Use `result` when the application already knows the next destination:

```tsx
<SpinWheel segments={segments} result={{ segmentId: 'badge' }} />
```

Or use the imperative API:

```tsx
const ref = useRef<SpinWheelRef>(null);

<SpinWheel ref={ref} segments={segments} />;

await ref.current?.spinTo('badge');
ref.current?.reset();
```

`spinTo()` uses `calculateSpinWheelDestination` to center the configured segment under the pointer. It does not inspect animation drift to determine a winner.

## Async or server result

```tsx
const resultProvider = async () => {
  const response = await api.requestSpin();
  return { segmentId: response.segmentId };
};

<SpinWheel segments={segments} resultProvider={resultProvider} />;
```

Networking stays in the application. Unknown provider failures become `ResultProviderError`; unknown returned segment IDs become `InvalidSegmentError`.

Client outcomes can be manipulated. For valuable rewards, a backend must validate eligibility, choose and persist the result, and return the selected segment ID. See [Server-authoritative results](./server-authoritative-results.md).

## Hook

```tsx
const { status, result, error, spin, spinTo, reset } = useSpinWheel({
  segments,
  randomSource,
});
```

`useSpinWheel` is useful for custom native renderers. Its play promises resolve after result selection; because it has no renderer, it completes the lifecycle immediately.

## Component API

| Prop                                           | Purpose                                                                                |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `segments`                                     | IDs, labels, values, colors, weights, and metadata.                                    |
| `result`                                       | Controlled next `{ segmentId }`.                                                       |
| `resultProvider` / `resultRequest`             | Application-supplied sync or async outcome.                                            |
| `randomSource`                                 | Injectable client random source.                                                       |
| `duration`, `rotations`, `direction`, `easing` | Destination animation controls.                                                        |
| `disabled`, `status`                           | Disabled or externally presented status.                                               |
| `reduceMotion`                                 | Short direct transition; system preference is used when omitted.                       |
| `renderSegment`, `renderPointer`               | Custom native renderers.                                                               |
| `theme`                                        | Per-wheel platform-neutral theme override.                                             |
| `accessibilityLabels`                          | Override wheel, action, progress, and result copy.                                     |
| Lifecycle callbacks / `onEvent`                | Ready, play, request, resolve, animation, reveal, completion, reset, and error events. |

`SpinWheelRef` exposes `spin()`, `spinTo(segmentId)`, and `reset()`. Spin promises resolve after the component finishes its animation and result announcement. Reset or unmount cancels active Reanimated work.

## Customization and themes

```tsx
<JackpotKitProvider theme={neonTheme}>
  <SpinWheel
    segments={segments}
    renderSegment={({ segment, selected, theme }) => (
      <MySegment label={segment.label} selected={selected} color={theme.colors.text} />
    )}
    renderPointer={(theme) => <MyPointer color={theme.colors.pointer} />}
  />
</JackpotKitProvider>
```

`defaultTheme`, `neonTheme`, and `createJackpotTheme` come from `@jackpotkit/theme`. Themes affect presentation and animation defaults only.

## Accessibility

- The center control exposes button, disabled, and busy states.
- Completion uses a polite visible result plus a screen-reader announcement.
- Default labels are overridable through `accessibilityLabels`.
- Segment labels provide non-color-only information.
- `reduceMotion` provides a brief direct transition, and the system reduced-motion setting is honored by default.
- Custom themes control contrast; applications are responsible for verifying their chosen combinations.

## Performance

- Result selection and geometry are separate from animation.
- Reanimated owns rotation without React state updates on animation frames.
- Static segment geometry is independent of weighted selection.
- Active animation is cancelled during reset and unmount.
- SVG is the only renderer dependency used by Spin Wheel; the optional Skia peer is isolated behind the Scratch Card subpath.
- Avoid creating a new random source or segment array on every parent render when continuity matters.

## Testing

`@jackpotkit/testing` provides `SequenceRandomSource`, `MockResultProvider`, and `createWheelSegments`. Use injected deterministic values instead of statistical assertions.

The Expo gallery includes an interactive playground for segment count, duration, rotations, result mode, theme, reduced motion, reset, and lifecycle status.
