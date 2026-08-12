---
title: Versioning and migrations
sidebar_position: 20
---

# Versioning and migrations

JackpotKit packages version independently with Semantic Versioning and Changesets. A stable `1.x`
version is a compatibility commitment for that package, not a claim that every future game is
already implemented.

## Compatibility policy

- Patch releases fix behavior without intentionally changing documented public contracts.
- Minor releases add backward-compatible APIs, entrypoints, tokens, callbacks, or capabilities.
- Major releases may remove, rename, or change documented behavior, required peers, export paths,
  result shapes, deterministic sequences, lifecycle ordering, or supported platform ranges.
- Undocumented internal files are not APIs. Only package export-map entrypoints are supported.
- Type-only breaking changes count as breaking changes even when emitted JavaScript is unchanged.
- The seeded random sequence is a public compatibility contract and cannot change in a minor or
  patch release.

Deprecations should remain for at least one minor release when practical. A deprecation must name
its replacement and intended removal release. Security fixes may use a faster removal timeline when
retaining behavior would leave consumers exposed.

## Migrating from pre-1.0

The stable candidate intentionally retains the documented Phase 7 API: ESM-only packages, exact
game subpaths, platform-neutral core and themes, React Native renderers, React web renderers, and
application-owned result providers. Consumers should prepare by:

1. Importing only documented root or exact game subpaths.
2. Removing imports from package `src`, `dist`, `lib`, or other internal paths.
3. Installing the documented React or React Native peer dependencies explicitly.
4. Treating client and seeded randomness as non-authoritative.
5. Running application tests against the release candidate, including custom renderers and themes.

The version pull request is the final source of truth for the exact versions included in `1.0.0`.
If API review introduces a breaking adjustment before publication, its Changeset and migration
instructions must be reviewed in that pull request.

## Migration documentation

Every future major Changeset must include:

- previous and replacement API examples;
- affected packages and exact subpaths;
- automated or mechanical migration steps where possible;
- behavior, typing, platform, and peer-dependency changes;
- rollback considerations for server-authoritative integrations.

Package changelogs and GitHub Releases link to the relevant guide. Consumers should upgrade one
major version at a time rather than skipping migration instructions.
