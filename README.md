# 🎰 JackpotKit

Open-source game mechanics and animated components for React Native and React.

> **Project status:** Phase 0 foundation. The workspace builds and validates, but no game API is implemented or published yet.

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

These games are roadmap items, not current exports.

## Workspace

| Package                    | Responsibility              | Phase 0 status          |
| -------------------------- | --------------------------- | ----------------------- |
| `@jackpotkit/core`         | Pure TypeScript mechanics   | Empty buildable shell   |
| `@jackpotkit/react-native` | Native hooks and renderers  | Empty Builder Bob shell |
| `@jackpotkit/react`        | React web renderers         | Empty buildable shell   |
| `@jackpotkit/theme`        | Theme contracts and presets | Empty buildable shell   |
| `@jackpotkit/testing`      | Consumer testing utilities  | Empty buildable shell   |

The `@jackpotkit` scope is provisional until npm ownership is authenticated and verified. Do not publish these packages from the foundation milestone.

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
pnpm check:exports
pnpm check:packs
```

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

## Applications

- `apps/expo-example`: responsive Expo Router gallery shell.
- `apps/web-example`: Vite proof that core resolves without native assumptions.
- `apps/docs`: Docusaurus documentation shell backed by root `docs/` content.

## Contributing and security

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request. Report vulnerabilities according to [SECURITY.md](./SECURITY.md), not through public issues.

## License

[MIT](./LICENSE) © 2026 Muhammad Daniyal Malik.
