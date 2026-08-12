---
title: Stable-release readiness
sidebar_position: 22
---

# Stable-release readiness

Phase 8 separates repository-verifiable gates from external release approval.

## Automated gates

`pnpm release:check` performs the frozen project validation and release-status review. CI verifies:

- formatting, lint, strict types, unit and component tests;
- core/native boundary and zero-telemetry rules;
- public dependency and peer allowlists;
- all TypeScript, Builder Bob, Vite, Docusaurus, and Expo builds;
- Expo Doctor and iOS, Android, and web JavaScript exports;
- exact runtime exports and declaration targets;
- isolated packed-consumer ESM and SSR execution;
- npm tarball allowlists and exclusion of tests, credentials, temporary files, and specifications;
- ESM package/type compatibility analysis for every packed public package;
- automated WCAG 2 A/AA checks for React web renderers.

## Human gates

Before approving `1.0.0`, the release pull request must record:

- API and generated declaration review for every public entrypoint;
- the manual accessibility matrix in [Accessibility review](./accessibility.md);
- iOS and Android example checks on supported devices or simulators;
- current browser checks for the Vite gallery;
- dependency advisory triage and peer-range review;
- documentation code-sample review by installing packed artifacts in a clean application;
- confirmation that npm trusted publishers and the protected GitHub `npm` environment are active;
- proposed versions, changelogs, tags, GitHub Release notes, and rollback owner.

These items cannot be honestly inferred from a local build. Failure to complete a human gate keeps
the packages in release-candidate status even when automation is green.

## Publication and verification

Merge the reviewed version pull request, run the manually approved Publish workflow from `main`,
then verify npm provenance, dist-tags, package contents, Git tags, and GitHub Releases. Do not use a
local npm token or manually create divergent tags.
