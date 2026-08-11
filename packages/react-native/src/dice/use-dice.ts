import { createDice, type DiceResult, type DiceSelection } from '@jackpotkit/core';
import { useCallback, useMemo } from 'react';

import { useOneShotController } from '../internal/use-one-shot-game';
import type { UseDiceOptions, UseDiceReturn } from './types';

export function useDiceController<TRequest>(
  options: UseDiceOptions<TRequest>,
  completeOnResolve: boolean,
) {
  const {
    count,
    dice,
    disabled = false,
    randomSource,
    result,
    resultProvider,
    resultRequest,
    sides,
  } = options;
  const engine = useMemo(
    () =>
      createDice({
        ...(count === undefined ? {} : { count }),
        ...(dice === undefined ? {} : { dice }),
        ...(randomSource === undefined ? {} : { randomSource }),
        ...(sides === undefined ? {} : { sides }),
      }),
    [count, dice, randomSource, sides],
  );
  const resolveRandom = useCallback(() => engine.roll(), [engine]);
  const resolveControlled = useCallback(
    (selection: DiceSelection) => engine.rollTo(selection),
    [engine],
  );
  const resolveProvider = useMemo(
    () =>
      resultProvider === undefined
        ? undefined
        : () => engine.rollWith(resultProvider, resultRequest as TRequest),
    [engine, resultProvider, resultRequest],
  );
  return useOneShotController<DiceResult, DiceSelection>({
    ...options,
    completeOnResolve,
    ...(result === undefined ? {} : { controlledSelection: result }),
    disabled,
    gameName: 'Dice',
    resetEngine: engine.reset,
    resolveControlled,
    ...(resolveProvider === undefined ? {} : { resolveProvider }),
    resolveRandom,
  });
}

export function useDice<TRequest = void>(options: UseDiceOptions<TRequest> = {}): UseDiceReturn {
  const controller = useDiceController(options, true);
  return {
    error: controller.error,
    reset: controller.reset,
    result: controller.result,
    roll: () => controller.play(),
    rollTo: controller.play,
    status: controller.status,
  };
}
