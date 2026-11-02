import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

/** `false` during server rendering and hydration, `true` afterwards. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
