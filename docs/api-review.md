---
title: Stable API review
sidebar_position: 19
---

# Stable API review

The Phase 8 review treats runtime exports, TypeScript declarations, deterministic behavior, result
authority, lifecycle ordering, peer ranges, and documented entrypoints as public compatibility
surface.

## Stable decisions

- All packages are ESM-only. CommonJS output is not part of `1.0.0`.
- Only package-root and declared exact game subpaths are public. Wildcard and internal source imports
  are unsupported.
- `@jackpotkit/core` remains independent of UI frameworks, native modules, DOM APIs, networking,
  storage, telemetry, and animation.
- Random, controlled, and application-provided result modes resolve through the same engine
  validation. A renderer never derives the outcome from its final visual position.
- Result providers are application-owned and may be synchronous or asynchronous. Reset invalidates
  late work; JackpotKit does not retry, persist, authorize, or fulfil results.
- Core results and persistent snapshots are immutable. Dice values, coin faces, wheel segments,
  Scratch Card prizes, slot grids, Bingo patterns, and Lucky Box selections retain their documented
  shapes.
- Seeded random output is deterministic compatibility behavior, while `MathRandomSource` makes no
  security or reproducibility guarantee.
- Hooks complete when core resolution finishes. Component play promises complete after their
  presentation lifecycle finishes; reset or unmount may reject active animation work.
- Platform themes change presentation only. They cannot influence selection, validation, paylines,
  coverage, calls, marks, or rewards.
- React Native Scratch Card remains isolated behind its exact optional-Skia subpath. React web does
  not alias React Native and remains safe to initialize during SSR.

## Automated review evidence

The export allowlists assert exact runtime names for every root and game subpath. Builds emit
declaration maps, dry-run package checks verify every export target, isolated consumers execute
packed ESM and SSR entrypoints, and Are the Types Wrong analyzes every packed public package with an
ESM-only profile.

These checks prevent accidental exports and common package/type-resolution errors. Reviewers still
inspect generated declarations and examples in the stable version pull request because automation
cannot decide whether a correctly emitted type is a good long-term contract.

## Changes after 1.0

New APIs must be additive in a minor release. Renaming exports, changing result or callback shapes,
altering deterministic sequences, changing lifecycle ordering, dropping platform support, or
narrowing peer ranges requires a major release and migration guide. See
[Versioning and migrations](./versioning.md).
