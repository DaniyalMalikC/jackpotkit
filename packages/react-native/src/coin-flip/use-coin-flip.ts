import { createCoinFlip, type CoinFlipResult, type CoinFlipSelection } from '@jackpotkit/core';
import { useCallback, useMemo } from 'react';

import { useOneShotController } from '../internal/use-one-shot-game';
import type { UseCoinFlipOptions, UseCoinFlipReturn } from './types';

export function useCoinFlipController<TValue, TRequest>(
  options: UseCoinFlipOptions<TValue, TRequest>,
  completeOnResolve: boolean,
) {
  const { disabled = false, faces, randomSource, result, resultProvider, resultRequest } = options;
  const engine = useMemo(
    () =>
      createCoinFlip<TValue>({
        ...(faces === undefined ? {} : { faces }),
        ...(randomSource === undefined ? {} : { randomSource }),
      }),
    [faces, randomSource],
  );
  const resolveRandom = useCallback(() => engine.flip(), [engine]);
  const resolveControlled = useCallback(
    (selection: CoinFlipSelection) => engine.flipTo(selection),
    [engine],
  );
  const resolveProvider = useMemo(
    () =>
      resultProvider === undefined
        ? undefined
        : () => engine.flipWith(resultProvider, resultRequest as TRequest),
    [engine, resultProvider, resultRequest],
  );
  return useOneShotController<CoinFlipResult<TValue>, CoinFlipSelection>({
    ...options,
    completeOnResolve,
    ...(result === undefined ? {} : { controlledSelection: result }),
    disabled,
    gameName: 'Coin Flip',
    resetEngine: engine.reset,
    resolveControlled,
    ...(resolveProvider === undefined ? {} : { resolveProvider }),
    resolveRandom,
  });
}

export function useCoinFlip<TValue = unknown, TRequest = void>(
  options: UseCoinFlipOptions<TValue, TRequest> = {},
): UseCoinFlipReturn<TValue> {
  const controller = useCoinFlipController(options, true);
  return {
    error: controller.error,
    flip: () => controller.play(),
    flipTo: controller.play,
    reset: controller.reset,
    result: controller.result,
    status: controller.status,
  };
}
