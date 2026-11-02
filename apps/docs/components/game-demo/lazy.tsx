'use client';

import dynamic from 'next/dynamic';

import type { GameDemoProps } from './game-demo';

/**
 * The simple single-game preview, code-split so pages that do not use it do not load all seven
 * game renderers. Rendering is client-only, as before.
 */
const LazyGameDemo = dynamic(() => import('./game-demo').then((module) => module.GameDemo), {
  ssr: false,
});

export function GameDemo(props: GameDemoProps) {
  return <LazyGameDemo {...props} />;
}
