# @jackpotkit/react-native

Accessible React Native hooks and renderers backed by the platform-independent JackpotKit core.

```bash
npm install @jackpotkit/react-native @jackpotkit/core @jackpotkit/theme react-native-reanimated react-native-worklets react-native-gesture-handler react-native-svg
```

## Spin Wheel

```tsx
import { SpinWheel, type SpinWheelRef } from '@jackpotkit/react-native/spin-wheel';

const ref = useRef<SpinWheelRef>(null);

<SpinWheel
  ref={ref}
  segments={segments}
  duration={3000}
  rotations={6}
  onComplete={(result) => console.log(result.segmentId)}
/>;

await ref.current?.spin();
await ref.current?.spinTo('bonus');
ref.current?.reset();
```

The root entrypoint exports Spin Wheel, Slot Machine, `JackpotKitProvider`, and `useJackpotKitTheme`. Scratch Card remains isolated behind its Skia-specific subpath.

Supported modes:

- Client-selected random and weighted results.
- A controlled `result={{ segmentId }}`.
- A synchronous or asynchronous `resultProvider` supplied by the application.
- Headless React Native state through `useSpinWheel`.

The renderer supports equal-sized responsive SVG segments, custom segment and pointer renderers, default or provider themes, configurable direction/duration/rotations/easing, reduced motion, disabled state, lifecycle callbacks, typed events, screen-reader result announcements, and imperative control.

The selected result is resolved and validated before animation. Animation drift is never used to decide the winner. Client randomness must not be trusted for valuable or security-sensitive rewards.

## Scratch Card

Scratch Card uses an optional Skia peer isolated behind its exact subpath:

```bash
npm install @jackpotkit/react-native @jackpotkit/core @jackpotkit/theme @shopify/react-native-skia react-native-reanimated react-native-worklets react-native-gesture-handler
```

```tsx
import { ScratchCard, type ScratchCardRef } from '@jackpotkit/react-native/scratch-card';

const ref = useRef<ScratchCardRef<Prize>>(null);

<ScratchCard
  ref={ref}
  width={320}
  height={180}
  result={{ prize }}
  onComplete={(result) => console.log(result.prize)}
>
  {(result) => <RewardCard prize={result?.prize} />}
</ScratchCard>;

await ref.current?.reveal();
ref.current?.reset();
```

The renderer supports solid, image, or custom Skia covers; deterministic coverage thresholds; controlled and application-provided results; ordinary React Native reward content; reduced motion; progress and lifecycle events; screen-reader actions and announcements; and manual reveal/reset. The root entrypoint does not export Scratch Card, so Spin Wheel consumers do not load Skia.

Scratching only reveals a result selected before completion. For valuable rewards, supply and persist the selection from an authoritative backend.

## Slot Machine

```tsx
import { SlotMachine, type SlotMachineRef } from '@jackpotkit/react-native/slot-machine';

const ref = useRef<SlotMachineRef>(null);

<SlotMachine
  ref={ref}
  symbols={symbols}
  reelCount={3}
  rowCount={3}
  paylines={paylines}
  onComplete={(result) => console.log(result.winningPaylines)}
/>;

await ref.current?.spin();
await ref.current?.spinTo(controlledSelection);
ref.current?.reset();
```

The renderer supports weighted random, controlled, and application-provided grids; arbitrary reels and rows; custom paylines and evaluation; staggered Reanimated reels; winning highlights; custom text, emoji, or image renderers; reduced motion; accessibility; themes; lifecycle events; and imperative play/reset.

Every reel animates toward a result already resolved and validated by core. Animation timing never determines the winning symbols.
