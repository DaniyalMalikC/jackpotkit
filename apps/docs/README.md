# @jackpotkit/docs

The JackpotKit documentation site: Next.js (App Router), Fumadocs, and Tailwind CSS v4. Content
lives in the repository root `docs/` directory, so it stays reviewable beside the code and readable
on GitHub.

```bash
pnpm --filter @jackpotkit/docs dev     # http://localhost:3000
pnpm --filter @jackpotkit/docs build   # link check, then next build
pnpm --filter @jackpotkit/docs start   # serve the production build
```

The site imports the workspace `@jackpotkit/core`, `@jackpotkit/react`, and `@jackpotkit/theme`
builds. `turbo` builds them first; when running `next dev` directly, run `pnpm build` once at the
root.

## Environment

| Variable                         | Default                                | Purpose                                                                                       |
| -------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `SITE_URL`                       | `https://jackpotkit.vercel.app`        | Canonical origin for metadata, Open Graph URLs, `sitemap.xml`, `robots.txt`.                  |
| `NEXT_PUBLIC_NATIVE_PREVIEW_URL` | `https://jackpotkit-native.vercel.app` | Origin of the Expo gallery web export embedded by `<NativePreview />`. Inlined at build time. |

The `SITE_URL` default is a placeholder until the production domain is confirmed. Set `SITE_URL` in
the deployment environment (for example, Vercel project settings) before the first public deploy.
`NEXT_PUBLIC_NATIVE_PREVIEW_URL` must be a different origin from the docs site (see below); it is
read at build time, so redeploy the docs after changing it.

## Content

- Pages are `.md`, or `.mdx` when they embed components. Frontmatter needs `title` and should
  include `description`. The first `# Heading` is removed at render time because the layout prints
  the title.
- Sidebar order and groups come from `docs/meta.json` and `docs/maintainers/meta.json`.
- Link between pages with relative file paths such as `./spin-wheel.mdx` or `../roadmap.md`. They
  work on GitHub and are rewritten to site routes. `scripts/check-links.mjs` fails the build and
  `test` on missing files or heading anchors.

## Generated API reference

Props, ref, and core type tables are generated at build time from the exported TypeScript types
with [fumadocs-typescript](https://fumadocs.dev/docs/integrations/typescript) (`remarkAutoTypeTable`
in `source.config.ts`). In MDX:

```mdx
<auto-type-table path="packages/react/src/spin-wheel/types.ts" name="SpinWheelProps" />

<platform-differences
  name="SpinWheelProps"
  web="packages/react/src/spin-wheel/types.ts"
  native="packages/react-native/src/spin-wheel/types.ts"
/>
```

- `path` is relative to the repository root. `tsconfig.api.json` resolves `@jackpotkit/core` and
  `@jackpotkit/theme` to their `src/`, so generation needs no package build and no network.
- `lib/api-reference/generator.ts` sorts members (required, optional, then `on*` callbacks), adds a
  description from `lib/api-reference/descriptions.ts` when the source has no TSDoc, and adds the
  default that the component assigns while destructuring its props (`lib/api-reference/defaults.ts`
  reads `const { size = 320 } = props` from `<Component>Inner`).
- `<platform-differences>` (`lib/api-reference/remark-platform-differences.ts`) lists props that
  exist on only one platform and props whose types differ, computed from both types.
- `test/api-reference.test.ts` fails when a table cannot be generated, when a member has no
  description, when a description or default names a member that no longer exists, when a game
  page lacks either platform's props table, or when the two platforms' ref methods diverge.

When a package adds a prop, add one sentence for it to `descriptions.ts` (or TSDoc in the source).

## Game playgrounds

Each game page embeds `<Playground game="spin-wheel" />` (registered in `components/mdx.tsx`, no
import needed). It renders the real `@jackpotkit/react` component with:

- prop controls generated from a typed per-game schema (`lib/playground/games.ts`);
- result modes: random (optionally seeded with `SeededRandomSource`), controlled (`result`), and a
  simulated server (`resultProvider`) with a latency slider and a "fail" switch that exercises
  `onError`;
- animation controls (`duration`, `easing`, `rotations`, `reelDelay`, `reduceMotion`) where the
  component has them;
- reset (the component's imperative `reset()`), remount, and restore-defaults buttons;
- an event log of every callback prop with a timestamp and JSON payload. It announces a summary
  through a polite live region at most every two seconds;
- a theme switch (match site, default, neon), a preview-width switch (360, 768, full);
- generated code with a copy button and an "Open in StackBlitz" handoff.

### Schemas cannot drift from the components

`defineGameSchema<Omit<ComponentProps<typeof SpinWheel>, 'ref'>>()` types every control against the
component's real props (`lib/playground/schema.ts`): a control must name an existing prop, the
control kind must fit the prop type (numbers, string unions, booleans, arrays of items), select
options must be valid values, and `events` must list every `on*` callback. `test/schema-types.ts`
holds `@ts-expect-error` cases for each rule and runs as part of `typecheck`. Configurations the
library rejects (for example a duplicate segment id) are caught by an error boundary that shows the
library's own error message.

### Generated code

`lib/playground/codegen.ts` prints a complete module: the game imported from its exact subpath,
only props that differ from the component's own defaults (`libraryDefaults`, read from the
component and engine sources and the exported `defaultTheme`, `DEFAULT_COIN_FACES`, and
`DEFAULT_BINGO_*` values), and the current result mode and theme. `test/codegen.test.ts` writes the
default and several modified states of all seven games to temporary `.tsx` files and type-checks
them with the TypeScript compiler API against `@jackpotkit/react` under the repository's strict
settings.

### No in-page code execution

The playground never evaluates user-editable code in the docs origin. "Open in StackBlitz" submits
a hidden form to StackBlitz's [POST API](https://developer.stackblitz.com/platform/api/post-api)
with a minimal Vite + React project (`lib/playground/stackblitz.ts`), so edited code runs in
StackBlitz's isolated origin. This adds no runtime dependency. An embedded Sandpack editor is
deferred; `test/stackblitz.test.ts` keeps the sandbox's package versions equal to the workspace's.

### Bundle and rendering

`components/playground/index.tsx` loads the playground with `next/dynamic` and `ssr: false`: pages
without a playground do not download it (covered by an E2E check), and client-only rendering avoids
hydration mismatches from client randomness. The simple `<GameDemo game="..." />` preview
(`components/game-demo/`) is still registered, also code-split; the homepage hero wheel uses its own
small component.

The playground shows the web renderer (`@jackpotkit/react`). Its caption links to the page's React
Native preview.

## React Native preview

Each game page also embeds `<NativePreview game="spin-wheel" />` (`components/native-preview/`) in a
"React Native preview" section. It is the real `@jackpotkit/react-native` playground from
`apps/expo-example`, rendered through react-native-web by the gallery's static web export
(`pnpm --filter @jackpotkit/expo-example build:web`, output `dist-web/`) and loaded from
`${NEXT_PUBLIC_NATIVE_PREVIEW_URL}/embed/<game>`.

- **Click to load.** Nothing is fetched until the visitor presses "Load React Native preview": the
  export is several megabytes of JavaScript, and Scratch Card also downloads the CanvasKit
  WebAssembly build (about 8 MB) for Skia. The frame also has `loading="lazy"`, a descriptive
  `title`, a fixed per-game height capped at 85% of the viewport, and full content width. Focus
  moves to the frame when it loads.
- **Sandbox.** `sandbox="allow-scripts allow-same-origin"`. react-native-web needs scripts, and the
  frame needs its own origin to fetch its chunks and `canvaskit.wasm` (an opaque sandboxed origin
  would make those requests cross-origin and fail). The pair only isolates the frame because the
  preview is served from a separate origin; never point it at the docs origin.
- **Framing policy.** The preview's `apps/expo-example/vercel.json` sends a
  `Content-Security-Policy` whose `frame-ancestors` lists `'self'`,
  `https://jackpotkit.vercel.app`, `https://*.vercel.app`, `http://localhost:*`, and
  `http://127.0.0.1:*`, and sends no `X-Frame-Options`, so only the docs site, its Vercel previews,
  and local development can frame it.
- **Honest copy.** The caption states that native-only behaviour (Reanimated worklets on the UI
  thread, Gesture Handler native gestures, haptics, platform font scaling) differs on devices, and
  how to run the Expo gallery locally (`pnpm --filter @jackpotkit/expo-example dev`). No EAS project
  exists yet, so there is no QR code.
- **No Snack links yet.** Expo Snack support for Expo SDK 57 with Reanimated 4 and
  react-native-worklets has not been verified (snack.expo.dev was unreachable from the environment
  that built this). A maintainer must confirm a game runs in Snack before links are added.

Run it locally against a local export:

```bash
pnpm turbo run build:web --filter=@jackpotkit/expo-example
node apps/e2e/scripts/static-server.mjs apps/expo-example/dist-web 4174 apps/expo-example/vercel.json
NEXT_PUBLIC_NATIVE_PREVIEW_URL=http://127.0.0.1:4174 pnpm --filter @jackpotkit/docs dev
```

```bash
pnpm --filter @jackpotkit/docs test   # link check, then vitest (codegen type-check, schemas, state)
```

## Code samples

Guide and recipe samples live in `examples/` (`web/`, `native/`, `server/`, `testing/`) and are
embedded in MDX with Fumadocs' include syntax, optionally a `// #region name` of the file:

```mdx
<include lang="tsx">../apps/docs/examples/web/theming.tsx#provider</include>
```

`test/examples.test.ts` type-checks every sample with the TypeScript compiler API under the shared
strict presets (React web or React Native), resolving the workspace packages to their sources.
`examples/testing/*.test.ts` also run as Vitest tests. `examples/` is excluded from the app's
`tsconfig.json` because the native samples need React Native types.

## Changelog and unreleased changes

`docs/changelog.mdx` includes each `packages/*/CHANGELOG.md` with `<include>`;
`lib/remark-demote-headings.ts` moves the included headings one level down. The migration guide's
`<UnreleasedChanges />` (`components/unreleased-changes.tsx`) reads `.changeset/*.md` while the
page is prerendered. `turbo.json` in this app adds those files and the package sources to the
`build` and `test` inputs, so cached builds are invalidated when they change.

## Search and SEO

Search uses Fumadocs' static Orama index from `app/api/search/route.ts`, built at build time and
queried in the browser. No external search service is used. `app/sitemap.ts`, `app/robots.ts`, and
the metadata in `app/layout.tsx` provide the SEO basics.

`app/og.png/route.tsx` renders the site's Open Graph image (1200 x 630) with `next/og` at build
time (`dynamic = 'force-static'`), using only the font bundled with Next.js, so the build fetches
nothing. The root layout and every docs page reference it as `og:image` and `twitter:image` with a
`summary_large_image` card (`ogImage` in `lib/site.ts`).
