import { act } from '@testing-library/react';
import { vi } from 'vitest';

/** Replaces `window.matchMedia` so `prefers-reduced-motion` reports `matches`. */
export function mockReducedMotionPreference(matches: boolean): () => void {
  const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      addEventListener: vi.fn(),
      matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
      media: query,
      removeEventListener: vi.fn(),
    }),
    writable: true,
  });
  return () => {
    if (original === undefined) Reflect.deleteProperty(window, 'matchMedia');
    else Object.defineProperty(window, 'matchMedia', original);
  };
}

export interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: unknown): void;
}

/** A promise whose settlement the test controls, for result providers. */
export function createDeferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

/** Advances fake timers inside `act`, flushing the microtasks that each timer schedules. */
export async function advance(milliseconds: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

/** Flushes pending promise callbacks inside `act` without moving fake time forward. */
export async function flushMicrotasks(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

/** Records lifecycle event types in the order a component emits them. */
export function createEventLog(): {
  readonly types: string[];
  readonly onEvent: (event: { readonly type: string }) => void;
} {
  const types: string[] = [];
  return { onEvent: (event) => types.push(event.type), types };
}
