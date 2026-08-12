import { AnimationError } from '@jackpotkit/core';

export interface AnimationWaiter {
  readonly promise: Promise<void>;
  cancel(message: string): void;
}

export function waitForAnimation(duration: number): AnimationWaiter {
  let resolvePromise!: () => void;
  let rejectPromise: ((reason: unknown) => void) | undefined;
  const promise = new Promise<void>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  const timeout = globalThis.setTimeout(resolvePromise, Math.max(0, duration));
  return {
    promise,
    cancel(message) {
      globalThis.clearTimeout(timeout);
      rejectPromise?.(new AnimationError(message));
      rejectPromise = undefined;
    },
  };
}
