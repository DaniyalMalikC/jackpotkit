import {
  createGameEvent,
  createSlotMachine,
  type SlotMachineResult,
  type SlotMachineSelection,
} from '@jackpotkit/core';
import { useCallback, useMemo } from 'react';
import { useOneShotController } from '../internal/use-one-shot-game.js';
import type { UseSlotMachineOptions, UseSlotMachineReturn } from './types.js';

export function useSlotMachineController<TValue, TEvaluation, TRequest>(
  options: UseSlotMachineOptions<TValue, TEvaluation, TRequest>,
  completeOnResolve: boolean,
) {
  const {
    disabled = false,
    evaluate,
    paylines,
    randomSource,
    reelCount,
    result,
    resultProvider,
    resultRequest,
    rowCount,
    symbols,
  } = options;
  const engine = useMemo(
    () =>
      createSlotMachine<TValue, TEvaluation>({
        symbols,
        reelCount,
        ...(rowCount === undefined ? {} : { rowCount }),
        ...(paylines === undefined ? {} : { paylines }),
        ...(randomSource === undefined ? {} : { randomSource }),
        ...(evaluate === undefined ? {} : { evaluate }),
      }),
    [evaluate, paylines, randomSource, reelCount, rowCount, symbols],
  );
  const resolveRandom = useCallback(() => engine.spin(), [engine]);
  const resolveControlled = useCallback(
    (selection: SlotMachineSelection) => engine.spinTo(selection),
    [engine],
  );
  const resolveProvider = useMemo(
    () =>
      resultProvider === undefined
        ? undefined
        : () => engine.spinWith(resultProvider, resultRequest as TRequest),
    [engine, resultProvider, resultRequest],
  );
  const controller = useOneShotController<
    SlotMachineResult<TValue, TEvaluation>,
    SlotMachineSelection
  >({
    ...options,
    completeOnResolve,
    ...(result === undefined ? {} : { controlledSelection: result }),
    disabled,
    gameName: 'Slot Machine',
    resetEngine: engine.reset,
    resolveControlled,
    ...(resolveProvider === undefined ? {} : { resolveProvider }),
    resolveRandom,
  });
  const reelStop = useCallback(
    (reelIndex: number, stoppedResult: SlotMachineResult<TValue, TEvaluation>) => {
      options.onEvent?.(createGameEvent('reel-stop', { reelIndex, result: stoppedResult }));
      options.onReelStop?.(reelIndex, stoppedResult);
    },
    [options],
  );
  return { ...controller, reelStop };
}
export function useSlotMachine<TValue = unknown, TEvaluation = unknown, TRequest = void>(
  options: UseSlotMachineOptions<TValue, TEvaluation, TRequest>,
): UseSlotMachineReturn<TValue, TEvaluation> {
  const controller = useSlotMachineController(options, true);
  return {
    error: controller.error,
    reset: controller.reset,
    result: controller.result,
    spin: () => controller.play(),
    spinTo: controller.play,
    status: controller.status,
  };
}
