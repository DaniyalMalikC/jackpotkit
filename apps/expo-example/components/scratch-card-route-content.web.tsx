import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { useSyncExternalStore } from 'react';
import { Text } from 'react-native';

const fallback = <Text selectable>Loading the Scratch Card renderer…</Text>;

/**
 * Load `canvaskit.wasm` from the site root, where `build:web` copies it (`setup-skia-web public`).
 * Without this, Emscripten resolves the file against the current page URL, which breaks on nested
 * routes such as `/embed/scratch-card`, and nothing is fetched from a CDN.
 */
const skiaWebOptions = {
  locateFile: (file: string) => `${process.env.EXPO_BASE_URL ?? ''}/${file}`,
};

// Hydration never changes again, so there is nothing to subscribe to.
const subscribe = () => () => undefined;

/**
 * `true` only after hydration. Static rendering emits the fallback, so the first client render
 * must emit it too; rendering `WithSkiaWeb` (a Suspense boundary) straight away is a hydration
 * mismatch (React error #418).
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export default function ScratchCardRouteContent() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return fallback;
  }

  return (
    <WithSkiaWeb
      fallback={fallback}
      getComponent={() => import('./scratch-card-playground')}
      opts={skiaWebOptions}
    />
  );
}
