'use client';

import dynamic from 'next/dynamic';

import type { GameId } from '@/lib/games';

function PlaygroundSkeleton() {
  return (
    <div
      aria-busy="true"
      className="not-prose my-6 flex min-h-[520px] items-center justify-center rounded-xl border bg-fd-card text-sm text-fd-muted-foreground"
    >
      Loading playground…
    </div>
  );
}

/**
 * Client-only, code-split playground. `ssr: false` doubles as the mount gate that avoids hydration
 * mismatches from client randomness, and the dynamic import keeps the playground bundle off every
 * page that does not render one.
 */
const LazyPlayground = dynamic(() => import('./playground').then((module) => module.Playground), {
  loading: PlaygroundSkeleton,
  ssr: false,
});

export interface PlaygroundProps {
  /** Which game to load. */
  readonly game: GameId;
}

export function Playground({ game }: PlaygroundProps) {
  return <LazyPlayground game={game} />;
}
