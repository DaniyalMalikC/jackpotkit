# 🎰 JackpotKit

Open-source game mechanics and animated components for React Native and React.

> **Project status:** Phase 8 release candidate. All seven planned games are implemented across core, React Native, and React web. The packages remain pre-1.0 until the stable-release review and approved publication complete.

JackpotKit is designed for promotional, loyalty, reward, educational, and gamification experiences. It separates pure game outcomes from platform state, rendering, and animation so applications can safely display random, controlled, or server-authoritative results.

## Product boundary

JackpotKit does not implement payments, deposits, withdrawals, wagering wallets, account balances, KYC, gambling licensing, financial settlement, cryptocurrency wallets, or prize fulfilment. It uses generic results, rewards, values, points, items, and metadata.

JackpotKit has no backend and sends no telemetry by default.

## Planned launch games

- Spin Wheel
- Scratch Card
- Slot Machine
- Bingo
- Dice
- Coin Flip
- Lucky Box

All seven games are available now from exact core, React Native, and React web subpath exports.

## Workspace

| Package                    | Responsibility              | Current status                         |
| -------------------------- | --------------------------- | -------------------------------------- |
| `@jackpotkit/core`         | Pure TypeScript mechanics   | Core primitives and seven game engines |
| `@jackpotkit/react-native` | Native hooks and renderers  | Seven implemented game experiences     |
| `@jackpotkit/react`        | React web hooks/renderers   | Seven implemented game experiences     |
| `@jackpotkit/theme`        | Theme contracts and presets | Default and neon themes                |
| `@jackpotkit/testing`      | Consumer testing utilities  | Deterministic helpers and factories    |

The `@jackpotkit` packages are public on npm. They remain pre-release APIs until the stable-release hardening milestone.

## React Native quick start

```bash
npm install @jackpotkit/react-native @jackpotkit/core @jackpotkit/theme react-native-reanimated react-native-worklets react-native-gesture-handler react-native-svg
```

Scratch Card uses an intentionally isolated Skia entrypoint:

```bash
npm install @jackpotkit/react-native @jackpotkit/core @jackpotkit/theme @shopify/react-native-skia react-native-reanimated react-native-worklets react-native-gesture-handler
```

```tsx
import { ScratchCard } from '@jackpotkit/react-native/scratch-card';

<ScratchCard
  width={320}
  height={180}
  result={{ prize: { id: 'points', label: '250 points' } }}
  onComplete={(result) => handleResult(result.prize)}
>
  {(result) => <RewardCard prize={result?.prize} />}
</ScratchCard>;
```

Slot Machine supports weighted random, controlled, and provider-supplied grids:

```tsx
import { SlotMachine } from '@jackpotkit/react-native/slot-machine';

<SlotMachine
  symbols={[
    { id: 'cherry', label: '🍒', weight: 5 },
    { id: 'star', label: '⭐', weight: 1 },
  ]}
  reelCount={3}
  rowCount={3}
  onComplete={(result) => handleGrid(result.data.reels)}
/>;
```

Bingo supports generated or supplied cards and persistent pattern state:

```tsx
import { SeededRandomSource } from '@jackpotkit/core';
import { Bingo } from '@jackpotkit/react-native/bingo';

<Bingo
  randomSource={new SeededRandomSource('preview')}
  onComplete={(result) => handlePatterns(result.matches)}
/>;
```

Phase 6 adds quick-play Dice, Coin Flip, and Lucky Box entrypoints:

```tsx
import { CoinFlip } from '@jackpotkit/react-native/coin-flip';
import { Dice } from '@jackpotkit/react-native/dice';
import { LuckyBox } from '@jackpotkit/react-native/lucky-box';

<Dice count={2} sides={6} />;
<CoinFlip result={{ faceId: 'tails' }} />;
<LuckyBox boxes={boxes} resultProvider={requestWinningBox} />;
```

```tsx
import { SpinWheel } from '@jackpotkit/react-native';

export function RewardWheel() {
  return (
    <SpinWheel
      segments={[
        { id: 'points', label: '100 points', value: 100, weight: 4 },
        { id: 'badge', label: 'Bonus badge', value: 'badge', weight: 1 },
      ]}
      onComplete={(result) => handleResult(result.segmentId)}
    />
  );
}
```

## React web quick start

```bash
npm install @jackpotkit/react @jackpotkit/core @jackpotkit/theme react react-dom
```

```tsx
import { SpinWheel } from '@jackpotkit/react/spin-wheel';

<SpinWheel
  segments={[
    { id: 'points', label: '100 points', weight: 4 },
    { id: 'badge', label: 'Bonus badge', weight: 1 },
  ]}
  onComplete={(result) => handleResult(result.segmentId)}
/>;
```

The web package has no React Native aliases or native peers. It uses CSS transforms, SVG, Canvas,
and Pointer Events, remains safe to import during SSR, and exposes every game through an exact
subpath such as `@jackpotkit/react/dice` or `@jackpotkit/react/scratch-card`.

## Headless example

```ts
import { SeededRandomSource, createSpinWheel } from '@jackpotkit/core';

const wheel = createSpinWheel({
  segments,
  randomSource: new SeededRandomSource('preview'),
});

const result = wheel.spin();
```

## Server result example

```tsx
const resultProvider = async () => {
  const response = await api.requestSpin();
  return { segmentId: response.segmentId };
};

<SpinWheel segments={segments} resultProvider={resultProvider} />;
```

Seeded and client randomness are for repeatable tests, previews, debugging, and ordinary gamification. They are not cryptographically secure. Valuable outcomes must be chosen and persisted by an authoritative backend.

## Development

Use Node 24 and the exact pnpm version declared in `package.json`.

```bash
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm install --frozen-lockfile
pnpm validate
```

Useful commands:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm check:consumers
pnpm check:api
pnpm check:dependencies
pnpm check:exports
pnpm check:packs
pnpm check:privacy
pnpm release:check
```

## Releases

Every publishable package change requires a Changeset. Merges to `main` update a draft release pull request; npm publication is a separate, manually approved workflow that uses npm Trusted Publishing rather than a long-lived write token.

See [the versioning and migration policy](./docs/versioning.md), [release-readiness checklist](./docs/release-readiness.md), and [release guide](./docs/releasing.md).

## Architecture

```text
Game Result
    ↓
Game Engine
    ↓
Game State
    ↓
Platform Adapter
    ↓
Renderer
    ↓
Animation
```

Game logic in `@jackpotkit/core` cannot depend on React, React Native, Expo, Skia, Reanimated, Gesture Handler, or browser globals. Animation must never become the source of truth for sensitive results.

Scratch Card's Skia renderer is available only from `@jackpotkit/react-native/scratch-card`; importing the package root does not load Skia.

## Applications

- `apps/expo-example`: responsive Expo Router gallery shell.
- `apps/web-example`: interactive Vite gallery for all seven React web renderers.
- `apps/docs`: Docusaurus documentation shell backed by root `docs/` content.

## Contributing and security

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request. Report vulnerabilities according to [SECURITY.md](./SECURITY.md), not through public issues.

## License

[MIT](./LICENSE) © 2026 Muhammad Daniyal Malik.
