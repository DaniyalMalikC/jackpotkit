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

The root entrypoint exports Spin Wheel, Slot Machine, Bingo, Dice, Coin Flip, Lucky Box, their hooks, `JackpotKitProvider`, and `useJackpotKitTheme`. Scratch Card remains isolated behind its Skia-specific subpath.

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

## Bingo

```tsx
import { Bingo, type BingoRef } from '@jackpotkit/react-native/bingo';

const ref = useRef<BingoRef>(null);

<Bingo ref={ref} patterns={['row', 'column', 'diagonal']} />;

ref.current?.call(27);
ref.current?.mark(27);
ref.current?.reset();
```

The responsive board supports generated or supplied cards, configurable dimensions, free spaces, deterministic calls, mark/unmark, built-in and custom patterns, custom cell renderers, themes, reduced motion, accessible state and announcements, lifecycle events, and imperative control. Rendering and animation never decide whether a pattern is complete.

## Dice, Coin Flip, and Lucky Box

```tsx
import { CoinFlip } from '@jackpotkit/react-native/coin-flip';
import { Dice } from '@jackpotkit/react-native/dice';
import { LuckyBox } from '@jackpotkit/react-native/lucky-box';

<Dice count={2} sides={6} faceStyle="pips" result={{ values: [2, 6] }} />;
<CoinFlip faceStyle="embossed" resultProvider={requestFace} />;
<LuckyBox boxes={boxes} onComplete={(result) => console.log(result.won)} />;
```

Each game supports random, controlled, and application-provided outcomes; custom renderers; transform-based animation; reduced motion; themes; lifecycle events; accessibility announcements; and imperative reset/play APIs. Dice resolves every die value before rolling and supports `faceStyle="numbers"` numeric faces or `faceStyle="pips"` conventional D6 pips. Coin Flip requires exactly two faces and supports `faceStyle="flat"` or `faceStyle="embossed"`. Lucky Box keeps the user's selection separate from the winning box and only exposes its optional reward when they match.
