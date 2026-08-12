import { GameStateError } from '@jackpotkit/core';
import { useCallback, useEffect, useRef } from 'react';

import { waitForAnimation, type AnimationWaiter } from './wait-for-animation.js';

export function useAnimationWaiter(gameName: string) {
  const waiterRef = useRef<AnimationWaiter | undefined>(undefined);

  const wait = useCallback(
    async (duration: number) => {
      if (waiterRef.current !== undefined) {
        throw new GameStateError(`${gameName} is already animating.`);
      }
      const waiter = waitForAnimation(duration);
      waiterRef.current = waiter;
      try {
        await waiter.promise;
      } finally {
        if (waiterRef.current === waiter) waiterRef.current = undefined;
      }
    },
    [gameName],
  );

  const cancel = useCallback((message: string) => {
    waiterRef.current?.cancel(message);
    waiterRef.current = undefined;
  }, []);

  useEffect(
    () => () => cancel(`${gameName} unmounted before its animation completed.`),
    [cancel, gameName],
  );

  return { cancel, wait };
}
