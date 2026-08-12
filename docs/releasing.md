---
title: Releasing
sidebar_position: 23
---

# Releasing

JackpotKit uses independent package versions and Changesets. Publishing is deliberately separated from ordinary CI and requires approval through the `npm` GitHub environment.

## One-time trusted-publisher setup

Before running the publish workflow, configure a trusted publisher for each public package on npm:

- provider: GitHub Actions;
- organization or user: `DaniyalMalikC`;
- repository: `jackpotkit`;
- workflow filename: `publish.yml`;
- environment: `npm`;
- allowed action: `npm publish`.

Create an `npm` environment in the GitHub repository and add a required reviewer. The workflow uses GitHub OIDC and must not receive an npm write token.

## Release sequence

1. Add a Changeset to every pull request that changes a public package.
2. Merge the feature or maintenance pull request into `main` after CI passes.
3. The `Release PR` workflow creates or updates a draft version pull request.
4. Review the proposed versions, package changelogs, and packed artifacts.
5. Complete the human gates in the [stable-release readiness checklist](./release-readiness.md) for a stable major release.
6. Mark the version pull request ready and merge it after CI passes.
7. Run the `Publish` workflow manually from the `main` branch.
8. Approve the `npm` environment deployment after reviewing the workflow summary.
9. Verify the npm versions, dist-tags, provenance, Git tags, and GitHub Releases.

The publish job always performs a frozen install and the complete validation suite before invoking Changesets. If trusted publishing is not configured for every package in the release, do not approve the job.

For the first stable release, the version pull request must resolve all five public packages to
`1.0.0`. A package must not retain a pending pre-release Changeset or publish under a stable tag at a
different major version.

## Local commands

```bash
pnpm changeset
pnpm release:status
pnpm release:check
pnpm version-packages
```

`pnpm release` publishes to npm and is reserved for the approved CI workflow. Do not run it locally for routine releases.
