---
title: FAQ
description: Answers to common questions about outcomes, fairness, platforms, SSR, bundles, and accessibility.
---

# FAQ

## Can players cheat the outcome?

Client-side outcomes (random, seeded, or controlled) can be changed by anyone with access to the
browser or app. For rewards with value, let your server decide and store the outcome and pass it
through `resultProvider`. See [Server-authoritative rewards](./recipes/server-authoritative-rewards.mdx).

## Is the randomness fair or certified?

The built-in random sources are for ordinary gamification, previews, and tests. They are not
represented as cryptographically secure, certified, or regulator-approved. Inject your own
`RandomSource` (an object with `next(): number` returning `[0, 1)`) when you need different
guarantees, and draw valuable outcomes on your server.

## Does JackpotKit handle payments, wallets, or real-money wagering?

No. It provides mechanics and presentation only: no payments, balances, wallets, KYC, settlement,
or prize fulfilment. Using it for regulated gambling is outside its scope and your responsibility.

## Does it collect data or phone home?

No. There is no telemetry and no network code in any package; the repository checks this with
`pnpm check:privacy`. Analytics are yours to wire up through callbacks
([Analytics recipe](./recipes/analytics.mdx)).

## Do weights change the size of wheel slices?

No. Weights only change probability. Every segment gets an equal slice.

## Which React and React Native versions are supported?

React `^19.2.3` on both platforms. React Native `>=0.83 <0.87` with Reanimated 4.5+ and
react-native-worklets 0.10 or 0.11. React 18 and Reanimated 3 are not supported. See
[Installation](./installation.mdx) for every peer range.

## Can I use the React Native package on the web?

Use `@jackpotkit/react` for React web apps; it is an independent DOM implementation with no native
dependency. `@jackpotkit/react-native` does run on react-native-web (the docs' React Native previews
use it), which suits Expo apps that also target the web.

## Does it work with Next.js, Remix, or other SSR frameworks?

Yes. Every `@jackpotkit/react` export can be imported and rendered on the server; browser APIs are
read only after mount. Render the games from client components
([Next.js notes](./installation.mdx#nextjs-and-other-ssr-frameworks)).

## Why do I get `Cannot use import statement outside a module`?

The packages are ESM-only. Jest in CommonJS mode must transform them; see
[Troubleshooting](./troubleshooting.md).

## Do I need Skia?

Only for the React Native Scratch Card (`@jackpotkit/react-native/scratch-card`). No other game, and
nothing in `@jackpotkit/react`, uses Skia.

## Can I bring my own artwork?

Yes. Every game has render callbacks (`renderSegment`, `renderSymbol`, `renderCell`, `renderDie`,
`renderFace`, `renderBox`, and Scratch Card covers) plus theme tokens. See
[Theming and customization](./theming.mdx).

## Is it accessible?

Each game has a keyboard and screen-reader operable action, exposes busy and disabled state,
announces results, follows reduced motion, and does not rely on color alone. Custom renderers and
colors are your responsibility. See [Accessibility review](./accessibility.md).

## How do I test code that uses JackpotKit?

Inject `SequenceRandomSource` or a controlled `result`, and use the fixtures in
`@jackpotkit/testing`. See [Seeded previews and testing](./recipes/seeded-previews-and-testing.mdx).

## Where are the changes between versions?

See the [Changelog](./changelog.mdx) and the [Migration guide](./migration.mdx).
