---
title: CI and agent automation
description: CI quality gates, browser E2E, and the Claude Code workflows that maintain JackpotKit.
---

# CI and agent automation

This page describes every GitHub Actions workflow in `.github/workflows/`, what triggers it, what it
may do, and what a maintainer must configure. Agent definitions in `.claude/agents/` do nothing on
their own; these workflows supply the triggers, scoped tokens, logs, and cost limits.

## Workflows at a glance

| Workflow                 | Trigger                                                        | Job permissions                                                    | Secrets             |
| ------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------- |
| `ci.yml`                 | `pull_request`, push to `main`                                 | `contents: read`                                                   | none                |
| `claude.yml`             | `@claude` in issues, comments, reviews, review comments        | `contents`, `pull-requests`, `issues`: write; `id-token: write`    | `ANTHROPIC_API_KEY` |
| `claude-review.yml`      | `pull_request` opened, synchronize, ready_for_review, reopened | `contents: read`, `pull-requests: write`, `id-token: write`        | `ANTHROPIC_API_KEY` |
| `claude-maintenance.yml` | Mondays 04:17 UTC, `workflow_dispatch`                         | `contents`, `pull-requests`, `issues`: write; `id-token: write`    | `ANTHROPIC_API_KEY` |
| `release-pr.yml`         | push to `main`, `workflow_dispatch`                            | `contents`, `pull-requests`: write                                 | none                |
| `publish.yml`            | `workflow_dispatch` on `main`, protected `npm` environment     | `contents`, `pull-requests`: write; `id-token: write` (provenance) | npm trusted publish |

Every workflow sets a workflow-level `permissions: contents: read` default (or the minimum it needs),
a `timeout-minutes` per job, and a `concurrency` group. Third-party actions are pinned to a major
version: `actions/checkout@v6`, `actions/setup-node@v6`, `pnpm/action-setup@v6`,
`actions/upload-artifact@v7`, `changesets/action@v1`, and `anthropics/claude-code-action@v1`.
`id-token: write` on the Claude workflows is required by the action's default Claude GitHub App
token exchange; it is not used to publish anything.

## CI (`ci.yml`)

- **validate** runs `pnpm validate`: format, lint, typecheck, unit tests, build, `expo-doctor`
  (needs network access to `exp.host`, available on GitHub runners), and every `check:*` gate.
- **e2e** runs in parallel with `validate`. It installs dependencies, runs
  `pnpm --filter @jackpotkit/e2e exec playwright install --with-deps <browser>`, builds the gallery,
  and runs `pnpm test:e2e`. On failure it uploads `playwright-report-<browser>` (HTML report,
  traces, screenshots) for 14 days. The matrix runs Chromium only; add `firefox` or `webkit` to
  `matrix.browser` to widen coverage. The suite supports both engines through `E2E_BROWSERS`.

Browser E2E is intentionally not part of `pnpm validate`, because it needs downloaded browsers.

## Browser E2E suite (`apps/e2e`)

`@jackpotkit/e2e` is a private workspace package using `@playwright/test` and `@axe-core/playwright`.
It currently targets the Vite gallery in `apps/web-example`, built and served with `vite preview`.

Coverage, for all seven games:

- each game renders with its primary control and a polite `role="status"` live region, and every
  control is reachable with Tab;
- each game is played with the keyboard and its announced result is asserted; Scratch Card is also
  revealed by pointer scratching;
- controls are disabled while a round is running;
- axe WCAG 2.0/2.1/2.2 A and AA scans of the page chrome, the whole page, and each game before and
  after a round;
- every game still completes with `reducedMotion: 'reduce'`;
- no horizontal overflow, and no card past the viewport, at 390 px.

Known library defects are not suppressed. Checks that fail because of them are marked `test.fail()`
with a comment describing the defect and its source file; once a fix lands, the
check reports "unexpectedly passed" and the marker must be removed. The gallery exposes no reset
control, so the visible-reset check is `test.fixme()` until one exists.

### Run E2E locally

```bash
pnpm install --frozen-lockfile
pnpm --filter @jackpotkit/e2e exec playwright install chromium   # once per Playwright version
pnpm test:e2e                                                    # builds the gallery, then runs
```

Useful variables:

| Variable           | Effect                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `E2E_BROWSERS`     | Comma-separated engines, for example `chromium,firefox,webkit`. Default `chromium`.                                           |
| `PW_CHROMIUM_PATH` | Launch an existing Chromium binary instead of the Playwright download.                                                        |
| `GALLERY_BASE_URL` | Test an already running gallery (for example `pnpm --filter @jackpotkit/web-example dev`) instead of starting `vite preview`. |
| `GALLERY_PORT`     | Port for the automatically started preview server. Default `4173`.                                                            |

Run a single file or open the UI runner from the package:

```bash
pnpm --filter @jackpotkit/e2e exec playwright test tests/gallery/gameplay.spec.ts
pnpm --filter @jackpotkit/e2e test:e2e:ui
pnpm --filter @jackpotkit/e2e exec playwright show-report
```

### Adding the documentation site

`apps/e2e/playwright.config.ts` builds one project per browser for the gallery (`gallery-<engine>`,
`testDir: tests/gallery`). To cover the docs site after phase B1:

1. Add `@jackpotkit/docs` as a `workspace:*` dev dependency of `@jackpotkit/e2e`, so `turbo run
test:e2e` builds it first.
2. Add a `DOCS_BASE_URL` variable (and a second `webServer` entry that starts the built site) and a
   `docs-<engine>` project per engine with `testDir: './tests/docs'` and that `baseURL`.
3. Put docs specs in `tests/docs/` and add `DOCS_BASE_URL` to `passThroughEnv` of the `test:e2e`
   task in `turbo.json`.

## Claude Code workflows

All three use `anthropics/claude-code-action@v1` with `anthropic_api_key`. The first step of each
job reads `secrets.ANTHROPIC_API_KEY` into an environment variable; when it is empty, the job logs a
"skipped" notice and every later step is skipped, so the run stays green until the secret exists.

### Mentions (`claude.yml`)

Runs when `@claude` appears in an issue title or body, an issue or PR comment, a PR review, or a PR
review comment, and only when the author's `author_association` is `OWNER`, `MEMBER`, or
`COLLABORATOR`. The action repeats its own write-access check and rejects bots by default. Claude
may push to its own `claude/` branch and open draft PRs or issues. Limits: 30-minute timeout,
`--max-turns 40`, one run at a time per issue or PR (job-level concurrency, queued, not cancelled).

### PR review (`claude-review.yml`)

Runs on `pull_request` (never `pull_request_target`) for non-draft PRs whose head branch is in this
repository and whose author is not a bot. Fork PRs get no secrets on `pull_request`, so they are
skipped by the job condition. The reviewer role is read from `.claude/agents/security-reviewer.md`
on the **base** commit, so a PR cannot rewrite its own reviewer. Claude may only read files, run
`gh pr diff`/`gh pr view`, post one summary comment, and add inline comments; editing, pushing, and
approving are disallowed. Limits: 20-minute timeout, `--max-turns 25`, a new push cancels the
in-progress review for that PR.

### Maintenance (`claude-maintenance.yml`)

Runs Mondays at 04:17 UTC and on demand from **Actions > Claude maintenance > Run workflow** with a
`task` input: `docs-gaps`, `broken-examples`, `dependency-review`, `missing-tests`, or
`issue-triage`. Scheduled runs rotate through the tasks by ISO week number. The orchestrator follows
`CLAUDE.md`, performs only the selected task, and reports in one of two ways:

- **Tracking issue**: a single open issue labelled `agent-report` titled `[agent-report] <task>`.
  An existing open issue is edited and commented on, never duplicated. The workflow creates the
  label if it is missing.
- **Draft PR**: small fixes on a `chore/agent-<task>-<YYYY-MM-DD>` branch, opened as a draft and
  linked from the tracking issue.

Limits: 45-minute timeout, `--max-turns 30`, and one maintenance run at a time
(`concurrency: claude-maintenance`, queued). The tool allowlist covers repository reads and edits,
`pnpm` checks, branch commits and pushes to `chore/agent-*`, and `gh issue`/`gh pr create`. Merging,
reviews, releases, publishing, force pushes, and edits under `.github/workflows/` are disallowed.

## How work persists

Agent runs are stateless. Work survives in:

- `agent-report` issues and PR comments (findings);
- draft pull requests on `claude/` and `chore/agent-*` branches (changes);
- [`project-plan.md`](./project-plan.md) (phase status, decisions, blockers), which the orchestrator
  updates in its draft PRs.

## Failure reporting

- GitHub notifies the workflow's triggering user (and anyone watching Actions) about failed runs.
- When a maintenance run fails after the secret check, a final step comments on the open
  `[agent-report] <task>` issue, or opens one, with a link to the failed run.
- Failed E2E runs upload the Playwright report artifact; failed reviews leave no comment, so check
  the run log.

## Cost controls

- `--max-turns` per workflow (40 mention, 25 review, 30 maintenance) and per-job timeouts (30, 20,
  45 minutes).
- Concurrency: one mention run per issue or PR, one review per PR (superseded by new pushes), and
  one maintenance run repository-wide.
- Reviews skip drafts, forks, and bot PRs; mentions require a trusted author association; the
  schedule is weekly.
- Track spend in the Anthropic Console for the key's workspace, and set a workspace spend limit.

## Human approval gates

Agents may open issues, push their own branches, and open draft pull requests. They never merge,
approve, publish to npm, deploy, or edit workflows. A maintainer must:

- review and merge every pull request;
- approve the protected `npm` environment for `publish.yml`;
- approve production deployment configuration changes, destructive operations, and breaking
  changes.

## Maintainer setup

1. Install the Claude GitHub App on the repository (`claude` then `/install-github-app`, or from
   the app's GitHub page). Repository admin access is required.
2. Add the `ANTHROPIC_API_KEY` repository secret (**Settings > Secrets and variables > Actions**).
3. Optionally set a spend limit for the key's workspace in the Anthropic Console.
4. Confirm the `npm` environment still requires manual approval.
