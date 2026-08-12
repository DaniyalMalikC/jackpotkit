---
id: introduction
title: Introduction
slug: /
sidebar_position: 1
---

<div className="hero-banner">

# JackpotKit

Open-source game mechanics and animated components for React Native and React.

**Current status:** Phase 8 release candidate. Spin Wheel, Scratch Card, Slot Machine, Bingo, Dice, Coin Flip, and Lucky Box are implemented as headless engines plus accessible React Native and React web hooks and components. Stable publication still requires the documented human release gates.

</div>

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

All five packages are published. `@jackpotkit/core` contains shared primitives and all seven planned game engines. `@jackpotkit/react-native` contains their native hooks, renderers, providers, and imperative APIs. `@jackpotkit/react` contains independent web implementations for every game. `@jackpotkit/theme` contains platform-neutral themes, while `@jackpotkit/testing` contains deterministic consumer helpers.

Start with [React web renderers](./react-web.md), [Spin Wheel](./spin-wheel.md), [Scratch Card](./scratch-card.md), [Slot Machine](./slot-machine.md), [Bingo](./bingo.md), [Dice](./dice.md), [Coin Flip](./coin-flip.md), [Lucky Box](./lucky-box.md), or [Core primitives](./core-primitives.md). Review the [API stability contract](./api-review.md) and [server-authoritative result boundary](./server-authoritative-results.md) before integrating rewards with real value.
