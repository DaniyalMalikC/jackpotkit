'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/playground/ui';
import { games, type GameId } from '@/lib/games';
import { nativePreviewUrl } from '@/lib/site';

/**
 * Frame height per game, in CSS pixels: the game and the start of its developer controls fit, and
 * the rest of the playground scrolls inside the frame. Capped at 85% of the viewport height.
 */
const frameHeights: Readonly<Record<GameId, number>> = {
  bingo: 760,
  'coin-flip': 680,
  dice: 620,
  'lucky-box': 780,
  'scratch-card': 680,
  'slot-machine': 860,
  'spin-wheel': 680,
};

export interface NativePreviewProps {
  /** Which game's embed route (`/embed/<game>`) to load. */
  readonly game: GameId;
}

export function nativePreviewSrc(game: GameId): string {
  return `${nativePreviewUrl}/embed/${game}`;
}

/**
 * The real `@jackpotkit/react-native` playground from `apps/expo-example`, rendered through
 * react-native-web by the gallery's static web export and embedded in an iframe.
 *
 * Nothing loads until the visitor asks for it: the export is several megabytes of JavaScript, and
 * Scratch Card also downloads the CanvasKit WebAssembly build. The frame is sandboxed with
 * `allow-scripts` (react-native-web renders in JavaScript) and `allow-same-origin` (the frame keeps
 * its own origin, so it can fetch its chunks and `canvaskit.wasm`). That pair is safe only because
 * the preview is served from a different origin than the docs site; see `lib/site.ts`.
 */
export function NativePreview({ game }: NativePreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const noteId = useId();
  const name = games.find((candidate) => candidate.id === game)?.name ?? game;
  const src = nativePreviewSrc(game);

  // The load button disappears when pressed; move focus to the frame so keyboard users keep
  // their place instead of falling back to the top of the document.
  useEffect(() => {
    if (loaded) frameRef.current?.focus();
  }, [loaded]);

  return (
    <figure
      className="not-prose my-6 min-w-0 overflow-hidden rounded-xl border bg-fd-card text-fd-card-foreground"
      data-native-preview={game}
    >
      {loaded ? (
        <iframe
          className="block w-full border-0 bg-jk-cream"
          loading="lazy"
          ref={frameRef}
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin"
          src={src}
          style={{ height: `min(${frameHeights[game]}px, 85vh)` }}
          title={`${name} React Native preview, rendered by @jackpotkit/react-native through react-native-web`}
        />
      ) : (
        <div className="flex flex-col items-start gap-3 p-4 sm:p-6">
          <p className="text-sm text-fd-muted-foreground" id={noteId}>
            Loads the Expo gallery&apos;s {name} playground from{' '}
            <code className="break-all">{nativePreviewUrl}</code> (several megabytes of JavaScript
            {game === 'scratch-card' ? ', plus the CanvasKit WebAssembly build for Skia' : ''}).
          </p>
          <Button aria-describedby={noteId} onClick={() => setLoaded(true)} variant="primary">
            Load React Native preview
          </Button>
        </div>
      )}
      <figcaption className="space-y-2 border-t px-4 py-3 text-sm text-fd-muted-foreground">
        <p>
          Rendered by <code>@jackpotkit/react-native</code> through react-native-web. Native-only
          behaviour (Reanimated worklets on the UI thread, Gesture Handler native gestures, haptics,
          platform font scaling) differs on devices — test on iOS/Android with the Expo app.{' '}
          {loaded ? (
            <a
              className="font-medium text-fd-primary underline"
              href={src}
              rel="noreferrer"
              target="_blank"
            >
              Open the preview in a new tab
            </a>
          ) : null}
        </p>
        <p>
          Run the Expo gallery on a device or simulator with{' '}
          <code>pnpm --filter @jackpotkit/expo-example dev</code> from a clone of the repository,
          then press <kbd>i</kbd> for the iOS simulator or <kbd>a</kbd> for an Android emulator.
        </p>
      </figcaption>
    </figure>
  );
}
