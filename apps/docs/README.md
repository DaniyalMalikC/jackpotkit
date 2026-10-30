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

## Live demos

MDX pages can use `<GameDemo game="spin-wheel" />` without an import. The registry is
`components/mdx.tsx`; the component and its per-game defaults are in `components/game-demo/`.
Defaults use only public `@jackpotkit/react` props. Pass `props` to override them.

## Search and SEO

Search uses Fumadocs' static Orama index from `app/api/search/route.ts`, built at build time and
queried in the browser. No external search service is used. `app/sitemap.ts`, `app/robots.ts`, and
the metadata in `app/layout.tsx` provide the SEO basics.
