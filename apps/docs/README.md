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

| Variable   | Default                         | Purpose                                                                      |
| ---------- | ------------------------------- | ---------------------------------------------------------------------------- |
| `SITE_URL` | `https://jackpotkit.vercel.app` | Canonical origin for metadata, Open Graph URLs, `sitemap.xml`, `robots.txt`. |

The default is a placeholder until the production domain is confirmed. Set `SITE_URL` in the
deployment environment (for example, Vercel project settings) before the first public deploy.

## Content

- Pages are `.md`, or `.mdx` when they embed components. Frontmatter needs `title` and should
  include `description`. The first `# Heading` is removed at render time because the layout prints
  the title.
- Sidebar order and groups come from `docs/meta.json` and `docs/maintainers/meta.json`.
- Link between pages with relative file paths such as `./spin-wheel.mdx` or `../roadmap.md`. They
  work on GitHub and are rewritten to site routes. `scripts/check-links.mjs` fails the build and
  `test` on missing files or heading anchors.

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

React Native renderers depend on native animation libraries and do not run in the browser; each
playground says so in its caption.

```bash
pnpm --filter @jackpotkit/docs test   # link check, then vitest (codegen type-check, schemas, state)
```

## Search and SEO

Search uses Fumadocs' static Orama index from `app/api/search/route.ts`, built at build time and
queried in the browser. No external search service is used. `app/sitemap.ts`, `app/robots.ts`, and
the metadata in `app/layout.tsx` provide the SEO basics.
