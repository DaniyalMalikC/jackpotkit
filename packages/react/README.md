# @jackpotkit/react

Accessible React web hooks and renderers backed by the platform-independent JackpotKit core.

```bash
npm install @jackpotkit/react @jackpotkit/core @jackpotkit/theme react react-dom
```

```tsx
import { SpinWheel, type SpinWheelRef } from '@jackpotkit/react/spin-wheel';

const ref = useRef<SpinWheelRef>(null);

<SpinWheel ref={ref} segments={segments} onComplete={(result) => console.log(result.segmentId)} />;
```

Exact entrypoints are available for `spin-wheel`, `scratch-card`, `slot-machine`, `bingo`, `dice`,
`coin-flip`, and `lucky-box`. The root also exports all seven components and hooks,
`JackpotKitProvider`, and `useJackpotKitTheme`.

The web implementations do not alias React Native components and have no native dependencies.
They use SVG for the wheel, Canvas and Pointer Events for scratching, semantic HTML controls, and
transform-based CSS motion. Module initialization does not access `window`, `document`, Canvas, or
image globals, so every entrypoint can be imported and server-rendered safely.

All games support core-owned random, controlled, or application-provided outcomes. Animation only
presents an already validated result. Client randomness is not proof of entitlement; valuable
outcomes must be selected and persisted by an authoritative backend.

See the [full documentation](https://github.com/DaniyalMalikC/jackpotkit/tree/main/docs) and the
interactive Vite gallery in `apps/web-example`.
