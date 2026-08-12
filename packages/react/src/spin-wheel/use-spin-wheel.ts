import { createSpinWheel, type SpinWheelResult } from '@jackpotkit/core';
import { useCallback, useMemo } from 'react';

import { useOneShotController } from '../internal/use-one-shot-game.js';
import type { UseSpinWheelOptions, UseSpinWheelReturn } from './types.js';

export function useSpinWheelController<TValue, TRequest>(
  options: UseSpinWheelOptions<TValue, TRequest>,
  completeOnResolve: boolean,
) {
  const {
    disabled = false,
    randomSource,
    result,
    resultProvider,
    resultRequest,
    segments,
  } = options;
  const engine = useMemo(
    () => createSpinWheel({ segments, ...(randomSource === undefined ? {} : { randomSource }) }),
    [randomSource, segments],
  );
  const resolveRandom = useCallback(() => engine.spin(), [engine]);
  const resolveControlled = useCallback(
    (selection: { readonly segmentId: string }) => engine.spinTo(selection.segmentId),
    [engine],
  );
  const resolveProvider = useMemo(
    () =>
      resultProvider === undefined
        ? undefined
        : () => engine.spinWith(resultProvider, resultRequest as TRequest),
    [engine, resultProvider, resultRequest],
  );
  return useOneShotController<SpinWheelResult<TValue>, { readonly segmentId: string }>({
    ...options,
    completeOnResolve,
    ...(result === undefined ? {} : { controlledSelection: result }),
    disabled,
    gameName: 'Spin Wheel',
    resetEngine: engine.reset,
    resolveControlled,
    ...(resolveProvider === undefined ? {} : { resolveProvider }),
    resolveRandom,
  });
}

export function useSpinWheel<TValue = unknown, TRequest = void>(
  options: UseSpinWheelOptions<TValue, TRequest>,
): UseSpinWheelReturn<TValue> {
  const controller = useSpinWheelController(options, true);
  return {
    error: controller.error,
    reset: controller.reset,
    result: controller.result,
    spin: () => controller.play(),
    spinTo: (segmentId) => controller.play({ segmentId }),
    status: controller.status,
  };
}
