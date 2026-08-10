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
