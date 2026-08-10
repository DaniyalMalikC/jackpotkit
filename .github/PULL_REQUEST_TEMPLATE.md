## Summary

Describe the problem and the completed change.

## Validation

- [ ] `pnpm validate` passes locally.
- [ ] Tests cover public behavior or the change is infrastructure-only.
- [ ] Documentation reflects public API or behavior changes.
- [ ] Package export maps remain deliberate and private files stay private.
- [ ] A Changeset is included when a publishable package changes after releases begin.

## Architecture and safety

- [ ] Core remains independent from UI and platform libraries.
- [ ] Animation does not determine results.
- [ ] No telemetry, credentials, payment behavior, or large mandatory assets were added.
- [ ] Accessibility and reduced motion were considered where UI changed.
