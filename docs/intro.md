---
id: introduction
title: Introduction
slug: /
sidebar_position: 1
---

<div className="hero-banner">

# JackpotKit

Open-source game mechanics and animated components for React Native and React.

**Current status:** Phase 1 shared primitives. The core and testing packages expose functional APIs; game packages begin with Spin Wheel in Phase 2.

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

All five packages are published. `@jackpotkit/core` now contains result, reward, lifecycle, randomness, provider, event, error, and validation primitives. `@jackpotkit/testing` contains deterministic consumer helpers. React, React Native, and theme entrypoints remain intentionally empty until their roadmap phases.

Start with [Core primitives](./core-primitives.md), or review the [server-authoritative result boundary](./server-authoritative-results.md) before integrating rewards with real value.
