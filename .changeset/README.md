# Changesets

Changesets record release intent for the published JackpotKit packages.

Create a changeset with:

```bash
pnpm changeset
```

Merges to `main` update the release pull request. Publication is a separate, manually approved GitHub Actions workflow using npm Trusted Publishing; see `docs/releasing.md`.
