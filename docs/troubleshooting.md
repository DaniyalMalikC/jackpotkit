---
title: Troubleshooting
description: Fixes for ESM-only imports in Jest, strict peer dependency errors, the worklets Babel plugin, Skia on the web, and Metro exports resolution.
---

# Troubleshooting

## Jest: Cannot use import statement outside a module

Every JackpotKit package is ESM-only (`"type": "module"`, no CommonJS build). Jest running in
CommonJS mode does not transform `node_modules` by default, so it loads the ESM files as CommonJS
and fails.

Choose one of these fixes:

- **Use Vitest** for web projects. It runs ES modules natively and needs no configuration for
  JackpotKit.
- **Transform JackpotKit in Jest.** Add `@jackpotkit` to the packages Jest transforms. With pnpm,
  include `.pnpm` so the real paths match. For React Native, this mirrors the repository's own
  `packages/react-native/jest.config.cjs`:

  ```js
  // jest.config.cjs
  module.exports = {
    preset: 'react-native', // or 'jest-expo', or '@react-native/jest-preset'
    transformIgnorePatterns: [
      'node_modules/(?!\\.pnpm|((jest-)?react-native|@react-native(-community)?|@jackpotkit|react-native-reanimated|react-native-svg|react-native-worklets)/)',
    ],
  };
  ```

  For a web project with `babel-jest`, use
  `transformIgnorePatterns: ['node_modules/(?!\\.pnpm|@jackpotkit/)']` and make sure your Babel
  config transforms ES modules (for example `@babel/preset-env` with `targets: { node: 'current' }`).

- **Run Jest in native ESM mode** (`NODE_OPTIONS=--experimental-vm-modules`, an ESM Jest config, and
  `extensionsToTreatAsEsm` for TypeScript). This avoids the transform but changes how your own
  tests load.

A `require('@jackpotkit/react')` call in your own CommonJS code fails for the same reason. Use
`import`, or `await import()` from CommonJS.

## Peer dependency errors

pnpm with `strict-peer-dependencies`, npm 7 and later, and Yarn report missing or out-of-range
peers. Install every required peer explicitly (see the [peer table](./installation.mdx#react-native)):

- `ERR_PNPM_PEER_DEP_ISSUES` or `ERESOLVE unable to resolve dependency tree` usually means React
  is older than `19.2.3`, or a native peer is outside its range (for example Reanimated 3, which is
  not supported; `@jackpotkit/react-native` needs Reanimated 4 and `react-native-worklets`).
- In Expo, install native peers with `npx expo install` so their versions match the SDK, then check
  the result against the peer ranges.
- `@shopify/react-native-skia` is an optional peer. A warning that it is missing is expected unless
  you use Scratch Card.
- Do not silence errors with `--legacy-peer-deps` or `--force`; a mismatched native peer usually
  fails at runtime instead.

## Reanimated or worklets errors

`[Worklets] Failed to create a worklet`, `Reanimated failed to initialize`, or a crash as soon as a
game animates usually means the worklets Babel plugin is missing or the app was not rebuilt.

- Bare React Native: add `'react-native-worklets/plugin'` as the **last** entry of `plugins` in
  `babel.config.js`. Reanimated 4 uses the worklets plugin; the Reanimated 3 plugin
  (`react-native-reanimated/plugin`) is not the right one.
- Expo: `babel-preset-expo` adds the plugin. Remove any manual Reanimated plugin entry you copied
  from older instructions.
- Clear the Metro cache (`npx expo start --clear` or `npx react-native start --reset-cache`) and
  rebuild the native app after changing native dependencies.

## Skia on the web (CanvasKit)

Scratch Card on React Native web (Expo web) draws with Skia's CanvasKit, a WebAssembly build that
must load before the component renders.

- Copy `canvaskit.wasm` into your web root. Skia ships a `setup-skia-web` command; the Expo gallery
  runs `setup-skia-web public` before `expo export`.
- Serve `canvaskit.wasm` with `Content-Type: application/wasm`.
- Load Scratch Card behind Skia's `WithSkiaWeb` with a dynamic import, as shown in
  [Scratch Card: Expo web](./scratch-card.mdx#expo-web), and guard static rendering with
  `typeof window === 'undefined'`.
- React web apps should use `@jackpotkit/react/scratch-card` instead. It uses an HTML Canvas and
  needs no Skia or WebAssembly.

## Metro cannot resolve `@jackpotkit/react-native/<game>`

Exact subpaths such as `@jackpotkit/react-native/spin-wheel` come from the package `exports` map.

- Metro 0.82 and later (React Native 0.79+, Expo SDK 53+) read `exports` by default. All supported
  React Native versions (0.83 to 0.86) qualify.
- If you set `resolver.unstable_enablePackageExports = false` in `metro.config.js`, remove it or
  set it to `true`.
- `@jackpotkit/react-native` resolves its `react-native` condition to TypeScript sources, which
  Metro compiles. Keep `ts` and `tsx` in `resolver.sourceExts` (the default).
- TypeScript reports `Cannot find module '@jackpotkit/react-native/spin-wheel'` when
  `moduleResolution` is `node` (Node 10). Use `"moduleResolution": "bundler"` (Expo's
  `expo/tsconfig.base` already does) or `node16`/`nodenext`.

## Scratch Card does not respond to touches

Wrap your app in `GestureHandlerRootView` from `react-native-gesture-handler`
([Installation](./installation.mdx#expo)). The screen-reader reveal action and `ref.reveal()`
still work without it, so the problem shows up only for touch scratching.

## Still stuck

Search the [FAQ](./faq.md) or open an issue on GitHub with your platform, package versions, and a
minimal reproduction.
