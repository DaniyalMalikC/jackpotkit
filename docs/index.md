---
title: Introduction
description: Headless game mechanics and accessible animated components for React and React Native.
---

# JackpotKit

Open-source game mechanics and animated components for React Native and React.

**Current status:** Stable `1.x`. Spin Wheel, Scratch Card, Slot Machine, Bingo, Dice, Coin Flip, and Lucky Box are published as headless engines plus accessible React Native and React web hooks and components.

JackpotKit separates game results, pure game engines, platform state, renderers, and animation. That separation allows applications to use random, predetermined, or server-authoritative outcomes without making an animation's stopping point the source of truth.

## Product boundary

JackpotKit provides mechanics and presentation. It does not provide payment processing, wagering wallets, account balances, KYC, financial settlement, licensing, cryptocurrency wallets, or prize fulfilment.

The library uses generic concepts such as rewards, results, values, points, items, and metadata. It has no backend and sends no telemetry by default.

## Packages

- `@jackpotkit/core`
- `@jackpotkit/react-native`
- `@jackpotkit/react`
- `@jackpotkit/theme`
- `@jackpotkit/testing`

All five packages are published with stable `1.x` APIs. `@jackpotkit/core` contains shared primitives and all seven launch game engines. `@jackpotkit/react-native` contains their native hooks, renderers, providers, and imperative APIs. `@jackpotkit/react` contains independent web implementations for every game. `@jackpotkit/theme` contains platform-neutral themes, while `@jackpotkit/testing` contains deterministic consumer helpers.

New here? Follow [Installation](./installation.mdx) and the [Quick start](./quick-start.mdx), then browse the [Recipes](./recipes/index.md) and [Theming](./theming.mdx). Explore the games: [React web renderers](./react-web.md), [Spin Wheel](./spin-wheel.mdx), [Scratch Card](./scratch-card.mdx), [Slot Machine](./slot-machine.mdx), [Bingo](./bingo.mdx), [Dice](./dice.mdx), [Coin Flip](./coin-flip.mdx), [Lucky Box](./lucky-box.mdx), or [Core primitives](./core-primitives.md). Review the [API stability contract](./api-review.md) and [server-authoritative result boundary](./server-authoritative-results.md) before integrating rewards with real value.
