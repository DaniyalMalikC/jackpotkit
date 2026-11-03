# Docs code samples

Code samples embedded in `docs/` with `<include lang="tsx">../apps/docs/examples/...</include>`.
`test/examples.test.ts` type-checks every file here under the repository's strict compiler
settings, against the workspace package sources, so a sample that stops compiling fails the docs
tests.

- `web/`: `@jackpotkit/react` samples (DOM and React types).
- `native/`: `@jackpotkit/react-native` samples (React Native types).
- `server/`: framework-neutral server code using `@jackpotkit/core` only.
- `testing/`: Vitest samples using `@jackpotkit/testing`.

Use `// #region name` / `// #endregion name` to include part of a file
(`<include lang="tsx">../apps/docs/examples/web/file.tsx#name</include>`). Declarations such as
`declare function saveReward(...)` stand in for application code the docs do not own.
