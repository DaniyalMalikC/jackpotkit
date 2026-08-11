# 🎰 JackpotKit

Open-source game mechanics and animated components for React Native and React.

> **Project status:** Phase 3. Spin Wheel and Scratch Card are available as headless engines and React Native experiences. The dedicated React web package remains a roadmap item.

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

Spin Wheel and Scratch Card are available now. The remaining games are roadmap items and are not current exports.

## Workspace

| Package                    | Responsibility              | Current status                       |
| -------------------------- | --------------------------- | ------------------------------------ |
| `@jackpotkit/core`         | Pure TypeScript mechanics   | Core primitives and two game engines |
| `@jackpotkit/react-native` | Native hooks and renderers  | Spin Wheel and Scratch Card          |
| `@jackpotkit/react`        | React web renderers         | Foundation shell                     |
| `@jackpotkit/theme`        | Theme contracts and presets | Default and neon themes              |
| `@jackpotkit/testing`      | Consumer testing utilities  | Deterministic helpers and factories  |

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
pnpm check:exports
pnpm check:packs
```

## Releases

Every publishable package change requires a Changeset. Merges to `main` update a draft release pull request; npm publication is a separate, manually approved workflow that uses npm Trusted Publishing rather than a long-lived write token.

See [the release guide](./docs/releasing.md) for the release sequence and one-time repository configuration.

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
- `apps/web-example`: Vite proof that core resolves without native assumptions.
- `apps/docs`: Docusaurus documentation shell backed by root `docs/` content.

## Contributing and security

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request. Report vulnerabilities according to [SECURITY.md](./SECURITY.md), not through public issues.

## License

[MIT](./LICENSE) © 2026 Muhammad Daniyal Malik.
