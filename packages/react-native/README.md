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

The root entrypoint exports the same Spin Wheel API plus `JackpotKitProvider` and `useJackpotKitTheme`.

Supported modes:

- Client-selected random and weighted results.
- A controlled `result={{ segmentId }}`.
- A synchronous or asynchronous `resultProvider` supplied by the application.
- Headless React Native state through `useSpinWheel`.

The renderer supports equal-sized responsive SVG segments, custom segment and pointer renderers, default or provider themes, configurable direction/duration/rotations/easing, reduced motion, disabled state, lifecycle callbacks, typed events, screen-reader result announcements, and imperative control.

The selected result is resolved and validated before animation. Animation drift is never used to decide the winner. Client randomness must not be trusted for valuable or security-sensitive rewards.
