import Link from 'next/link';

import { GameIcon } from '@/components/home/game-icon';
import { HeroWheel } from '@/components/home/hero-wheel';
import { InstallTabs } from '@/components/home/install-tabs';
import { LogoMark } from '@/components/logo';
import { games } from '@/lib/games';
import { githubUrl, npmUrl, siteTagline } from '@/lib/site';

const features = [
  {
    title: 'Headless core',
    body: '@jackpotkit/core holds every game engine in pure TypeScript with no React, React Native, or browser imports. Build your own UI on the same rules.',
  },
  {
    title: 'Server-authoritative results',
    body: 'Pass a controlled result or a result provider. Animation only visualises the outcome; it never decides it.',
    href: '/docs/server-authoritative-results',
  },
  {
    title: 'Seeded randomness',
    body: 'Inject any RandomSource. SeededRandomSource makes previews, tests, and replays deterministic.',
    href: '/docs/core-primitives',
  },
  {
    title: 'Accessible by default',
    body: 'Keyboard and screen-reader operable actions, live result announcements, and prefers-reduced-motion support.',
    href: '/docs/accessibility',
  },
  {
    title: 'SSR-safe on the web',
    body: '@jackpotkit/react touches browser APIs only after mount, so it renders in Next.js and other server frameworks.',
    href: '/docs/react-web',
  },
  {
    title: 'Tree-shakeable subpaths',
    body: "Import exactly one game with '@jackpotkit/react/spin-wheel'. Packages are ESM and side-effect free.",
    href: '/docs/api-review',
  },
  {
    title: 'No telemetry',
    body: 'No analytics, no backend, no network calls. Any tracking stays in your application, behind your consent flow.',
    href: '/docs/privacy',
  },
] as const;

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden border-b">
        <div aria-hidden="true" className="jk-hero-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.1fr_1fr] md:px-6 md:py-20">
          <div className="jk-fade-up flex flex-col items-start gap-5">
            <span className="inline-flex items-center gap-2 rounded-full border bg-fd-card px-3 py-1 text-xs text-fd-muted-foreground">
              <LogoMark className="jk-float size-4" />
              Open source, MIT licensed
            </span>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">JackpotKit</h1>
            <p className="max-w-xl text-lg text-fd-muted-foreground">
              {siteTagline} Seven games with headless engines, accessible renderers, and results
              your server controls.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground hover:bg-fd-primary/90"
                href="/docs"
              >
                Get started
              </Link>
              <a
                className="rounded-lg border bg-fd-card px-4 py-2 text-sm font-medium"
                href={githubUrl}
                rel="noreferrer"
              >
                GitHub
              </a>
              <a
                className="rounded-lg border bg-fd-card px-4 py-2 text-sm font-medium"
                href={npmUrl}
                rel="noreferrer"
              >
                npm
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-2xl border bg-fd-card/80 p-4 shadow-sm backdrop-blur">
            <HeroWheel />
            <p className="mt-2 text-center text-xs text-fd-muted-foreground">
              Live <code>@jackpotkit/react/spin-wheel</code>. The result is chosen before the wheel
              moves.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="install-title"
        className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6"
      >
        <h2 className="mb-2 text-2xl font-semibold" id="install-title">
          Install
        </h2>
        <p className="mb-6 text-fd-muted-foreground">
          Pick a platform. Both share <code>@jackpotkit/core</code> and{' '}
          <code>@jackpotkit/theme</code>.
        </p>
        <InstallTabs />
      </section>

      <section
        aria-labelledby="games-title"
        className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6"
      >
        <h2 className="mb-6 text-2xl font-semibold" id="games-title">
          Seven games
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game) => (
            <li key={game.id}>
              <Link
                className="jk-card flex h-full flex-col gap-2 rounded-xl border bg-fd-card p-4 hover:border-fd-primary"
                href={`/docs/${game.id}`}
              >
                <span className="inline-flex items-center gap-2 font-medium">
                  <span className="rounded-md bg-fd-primary/10 p-1.5 text-fd-primary">
                    <GameIcon game={game.id} />
                  </span>
                  {game.name}
                </span>
                <span className="text-sm text-fd-muted-foreground">{game.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="platforms-title"
        className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6"
      >
        <h2 className="mb-6 text-2xl font-semibold" id="platforms-title">
          React and React Native
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-fd-card p-5">
            <h3 className="mb-2 font-semibold">
              <code>@jackpotkit/react</code>
            </h3>
            <p className="text-sm text-fd-muted-foreground">
              Independent web implementations built on SVG, Canvas, Pointer Events, and CSS
              transforms. No Expo or native peers, and SSR-safe for Next.js.
            </p>
          </div>
          <div className="rounded-xl border bg-fd-card p-5">
            <h3 className="mb-2 font-semibold">
              <code>@jackpotkit/react-native</code>
            </h3>
            <p className="text-sm text-fd-muted-foreground">
              Native hooks and renderers using Reanimated, Gesture Handler, and React Native SVG.
              Skia is loaded only by the Scratch Card subpath.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-fd-muted-foreground">
          Both packages expose the same game names, result modes, and lifecycle callbacks, and both
          read results from <code>@jackpotkit/core</code>.
        </p>
      </section>

      <section
        aria-labelledby="features-title"
        className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6"
      >
        <h2 className="mb-6 text-2xl font-semibold" id="features-title">
          Built for real products
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li className="rounded-xl border bg-fd-card p-5" key={feature.title}>
              <h3 className="mb-2 font-semibold">
                {'href' in feature ? (
                  <Link className="hover:underline" href={feature.href}>
                    {feature.title}
                  </Link>
                ) : (
                  feature.title
                )}
              </h3>
              <p className="text-sm text-fd-muted-foreground">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-fd-muted-foreground md:px-6">
          <span>MIT licensed. No telemetry.</span>
          <nav aria-label="Footer" className="flex gap-4">
            <Link href="/docs">Docs</Link>
            <a href={githubUrl} rel="noreferrer">
              GitHub
            </a>
            <a href={npmUrl} rel="noreferrer">
              npm
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
