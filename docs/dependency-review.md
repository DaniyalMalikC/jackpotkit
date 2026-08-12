---
title: Dependency review
sidebar_position: 21
---

# Dependency review

The stable public dependency surface is deliberately small:

- `@jackpotkit/core` and `@jackpotkit/theme` have no runtime dependencies.
- `@jackpotkit/testing` depends only on `@jackpotkit/core`.
- `@jackpotkit/react` depends only on JackpotKit core and theme; React and React DOM are peers.
- `@jackpotkit/react-native` depends only on JackpotKit core and theme; native renderers are peers,
  and Skia remains optional and isolated to Scratch Card.

`pnpm check:dependencies` locks these allowlists, internal workspace ranges, tree-shaking metadata,
absence of package lifecycle scripts, public access, license, and provenance metadata. Any change to
that script is itself a dependency-review decision.

Repository applications and build tools are not shipped inside package tarballs. They are still
reviewed through the exact lockfile, frozen CI install, pnpm supply-chain policy, package dry runs,
and periodic advisory triage. An advisory in a private documentation or example tool must be
evaluated for reachability and patched or recorded before release; it must never be mistaken for a
runtime dependency of a public JackpotKit package.

## Current workspace advisory disposition

The 2026-08-12 Phase 8 audit found no affected dependency shipped in a public package tarball.
Available `webpack` and `serialize-javascript` fixes are enforced through root overrides. The
remaining reported `uuid` and `image-size` paths belong to private Expo or Docusaurus tooling.
Builds use repository-owned configuration and content rather than untrusted remote build inputs.
They remain tracked for upstream patches; in particular, the registry did not yet contain the
advisory-listed patched `image-size` release during this review. Re-run `pnpm audit` immediately
before approving the stable release and document any changed reachability or patch decision in the
version pull request.

Supported peer ranges are reviewed in each release candidate against the example applications.
Expanding or narrowing a stable peer range requires a Changeset and compatibility evidence.
