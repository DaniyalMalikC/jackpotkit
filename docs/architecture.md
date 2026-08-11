---
title: Architecture
sidebar_position: 2
---

# Architecture

JackpotKit's non-negotiable dependency direction is:

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

An outcome never depends on where an animation happens to stop. The pure TypeScript core package cannot import React, React Native, Expo, DOM APIs, Reanimated, Gesture Handler, or Skia.

## Package roles

- `core`: platform-independent engines, validation, lifecycle, result providers, randomness, and errors.
- `react-native`: native hooks, renderers, animation, gestures, accessibility, and imperative handles.
- `react`: web-specific hooks and renderers that reuse core mechanics.
- `theme`: platform-neutral theme contracts and presets.
- `testing`: deterministic random sources, result providers, and factories for consumers.
- `shared-config`: private workspace configuration; never published.

Subpath exports are added only alongside implemented public features. Wildcard exports are avoided so private implementation files cannot become accidental APIs.

## Core boundary

The core package now owns contracts and small utilities, not a universal runtime or event bus. A game may use the standard statuses and events without being forced into transitions that do not match its interaction model. Consumers inject randomness and result providers; networking and persistence stay outside the library.

## Spin Wheel reference flow

```text
Random, controlled, or provider selection
    ↓
Core validates the segment ID
    ↓
Core calculates the exact destination angle
    ↓
React Native animates a shared rotation value
    ↓
Renderer reveals and announces the known result
```

Selection weights affect only the first step. The SVG renderer always divides its circle into equal visual slices, so probability cannot accidentally leak into layout geometry.

## Scratch Card reference flow

```text
Controlled or provider prize
    ↓
Core validates and stores the result
    ↓
Core grid tracker measures erased coverage
    ↓
Gesture Handler supplies pointer paths
    ↓
Skia clears only the visual cover
    ↓
React Native reveals the already-known result
```

The reward is ordinary React Native content beneath the cover. Skia is an optional peer used only by the exact `@jackpotkit/react-native/scratch-card` subpath, so the root entrypoint and Spin Wheel do not acquire a Skia runtime dependency.

## Slot Machine reference flow

```text
Weighted, controlled, or provider symbol-ID grid
    ↓
Core validates every reel and row
    ↓
Core evaluates configured matching paylines
    ↓
Consumer evaluator adds domain-specific metadata
    ↓
Independent Reanimated reels display the known grid
    ↓
Final reel stop reveals and announces the result
```

Paylines contain one row index per reel. Reel animation is split into child components with independent shared values, preventing frame updates from becoming parent React state. Custom evaluation can describe rewards or campaign tiers but never changes the resolved grid.
