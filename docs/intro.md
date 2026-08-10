---
id: introduction
title: Introduction
slug: /
sidebar_position: 1
---

<div className="hero-banner">

# JackpotKit

Open-source game mechanics and animated components for React Native and React.

**Current status:** Phase 0 foundation. The package shells are published at `0.0.x`, but no game API is implemented yet.

</div>

JackpotKit separates game results, pure game engines, platform state, renderers, and animation. That separation allows applications to use random, predetermined, or server-authoritative outcomes without making an animation's stopping point the source of truth.

## Product boundary

JackpotKit provides mechanics and presentation. It does not provide payment processing, wagering wallets, account balances, KYC, financial settlement, licensing, cryptocurrency wallets, or prize fulfilment.

The library uses generic concepts such as rewards, results, values, points, items, and metadata. It has no backend and sends no telemetry by default.

## Foundation packages

- `@jackpotkit/core`
- `@jackpotkit/react-native`
- `@jackpotkit/react`
- `@jackpotkit/theme`
- `@jackpotkit/testing`

These are published, buildable package shells. The `0.0.x` line intentionally exposes no runtime behavior; functional APIs begin in later milestones.
