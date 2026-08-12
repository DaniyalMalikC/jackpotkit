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
The platform renderer animates the known rotation
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

The reward is ordinary React content beneath the cover. React Native uses an optional Skia peer isolated behind its exact Scratch Card subpath; React web uses Canvas and Pointer Events without affecting core.

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

## Bingo reference flow

```text
Generated or externally supplied card
    ↓
Core validates dimensions, ranges, uniqueness, and patterns
    ↓
Calls and marks produce immutable state snapshots
    ↓
Core evaluates concrete completion coordinates
    ↓
The platform renderer exposes and announces the current board state
```

The board is row-major and remains fixed until a new engine is created. Random drawing, rendering, and mark transitions cannot change pattern logic. Applications can persist snapshots and own any authoritative call transport without introducing networking or storage into core.

## Phase 6 one-shot flow

Dice and Coin Flip resolve exact values or a face before transform animation. Lucky Box first records the user's selected box, then independently resolves and validates the winning box before revealing it. In every case, random, controlled, and provider modes converge on the same immutable result; animation can display that result but cannot choose or modify it.

## Phase 7 web boundary

`@jackpotkit/react` imports the same core engines and theme contracts but never imports or aliases the React Native package. DOM APIs are confined to mounted effects and Pointer Event handlers, so module initialization and server rendering remain safe. Exact subpaths preserve tree shaking, while SVG, Canvas, CSS transforms, and semantic HTML provide browser-native presentation.
