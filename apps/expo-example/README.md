# @jackpotkit/expo-example

The Expo Router gallery: a playground for every `@jackpotkit/react-native` game, run on iOS,
Android, and the web (react-native-web). Its static web export is also the React Native preview
embedded on the documentation site's game pages.

```bash
pnpm --filter @jackpotkit/expo-example dev        # Expo CLI: press i (iOS), a (Android), w (web)
pnpm --filter @jackpotkit/expo-example build      # expo export for all platforms into dist/
pnpm turbo run build:web --filter=@jackpotkit/expo-example   # web-only static export into dist-web/
```

`build` and `build:web` need the workspace packages built first; the turbo commands handle that
(`^build`). Run `pnpm build` at the root once before calling the package scripts directly.

## Routes

- `/` is the gallery and `/<game>` (for example `/spin-wheel`) is each game's playground with the
  stack header.
- `/embed/<game>` renders the same playground without the gallery chrome, at the full frame width
  on the neutral gallery background, for iframes. It is pre-rendered for all seven games through
  `generateStaticParams` in `app/embed/[game].tsx`. The playgrounds draw light cards with dark
  text, so the embed keeps a light background rather than a transparent one.

## Skia on the web (Scratch Card)

Scratch Card renders with `@shopify/react-native-skia`, which needs CanvasKit on the web.
`components/scratch-card-route-content.web.tsx` wraps the playground in `WithSkiaWeb` and:

- loads `canvaskit.wasm` from the site root (`locateFile`). Both build scripts first run
  `setup-skia-web public`, which copies the installed `canvaskit-wasm/bin/full/canvaskit.wasm` into
  `public/` (git-ignored), and Expo copies `public/` into the export. Nothing is fetched from a
  CDN, and nested routes such as `/embed/scratch-card` resolve the same file;
- renders the loading fallback until hydration, matching the static HTML, so React does not report a
  hydration mismatch.

## Deploying the web export on Vercel

`vercel.json` holds the build settings, so a Vercel project only needs:

| Setting                            | Value                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| Root Directory                     | `apps/expo-example`                                                          |
| Include files outside the root dir | Enabled (the default; the build uses the whole workspace)                    |
| Framework Preset                   | Other (`"framework": null`)                                                  |
| Install Command                    | `pnpm install --frozen-lockfile` (from `vercel.json`; runs at the repo root) |
| Build Command                      | `cd ../.. && pnpm turbo run build:web --filter=@jackpotkit/expo-example`     |
| Output Directory                   | `dist-web`                                                                   |
| Node.js Version                    | 24.x                                                                         |

`vercel.json` also sets:

- `cleanUrls`, so `/embed/spin-wheel` serves `embed/spin-wheel.html`;
- a `Content-Security-Policy` whose `frame-ancestors` lists `'self'`,
  `https://jackpotkit.vercel.app`, `https://*.vercel.app`, `http://localhost:*`, and
  `http://127.0.0.1:*` on every response, and no `X-Frame-Options`, so the docs site, its Vercel
  previews, and local development can frame the preview and other sites cannot.
  `https://*.vercel.app` admits any Vercel deployment; narrow it once the docs have a custom domain;
- long-lived caching for the hashed `/_expo/static/` bundles and `application/wasm` for
  `canvaskit.wasm`.

Point the docs at the deployment with `NEXT_PUBLIC_NATIVE_PREVIEW_URL` (see `apps/docs/README.md`).
`apps/e2e/scripts/static-server.mjs` serves `dist-web/` with the same URL rules and headers for the
`native-<browser>` E2E project.
