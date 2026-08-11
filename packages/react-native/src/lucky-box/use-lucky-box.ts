import { createLuckyBox, type LuckyBoxResult, type LuckyBoxSelection } from '@jackpotkit/core';
import { useCallback, useMemo, useState } from 'react';

import { useOneShotController } from '../internal/use-one-shot-game';
import type { UseLuckyBoxOptions, UseLuckyBoxReturn } from './types';

export function useLuckyBoxController<TReward, TRequest>(
  options: UseLuckyBoxOptions<TReward, TRequest>,
  completeOnResolve: boolean,
) {
  const { boxes, disabled = false, randomSource, result, resultProvider, resultRequest } = options;
  const engine = useMemo(
    () =>
      createLuckyBox<TReward>({ boxes, ...(randomSource === undefined ? {} : { randomSource }) }),
    [boxes, randomSource],
  );
  const [selectedBoxId, setSelectedBoxId] = useState<string>();
  const select = useCallback(
    (boxId: string) => {
      engine.select(boxId);
      setSelectedBoxId(boxId);
      const selectedBox = engine.boxes.find((box) => box.id === boxId);
      if (selectedBox !== undefined) options.onSelect?.(selectedBox);
    },
    [engine, options],
  );
  const resolveRandom = useCallback(() => engine.reveal(), [engine]);
  const resolveControlled = useCallback(
    (selection: LuckyBoxSelection) => engine.revealTo(selection),
    [engine],
  );
  const resolveProvider = useMemo(
    () =>
      resultProvider === undefined
        ? undefined
        : () => engine.revealWith(resultProvider, resultRequest as TRequest),
    [engine, resultProvider, resultRequest],
  );
  const resetEngine = useCallback(() => {
    engine.reset();
    setSelectedBoxId(undefined);
  }, [engine]);
  const controller = useOneShotController<LuckyBoxResult<TReward>, LuckyBoxSelection>({
    ...options,
    completeOnResolve,
    ...(result === undefined ? {} : { controlledSelection: result }),
    disabled,
    gameName: 'Lucky Box',
    resetEngine,
    resolveControlled,
    ...(resolveProvider === undefined ? {} : { resolveProvider }),
    resolveRandom,
  });
  const pick = useCallback(
    (boxId: string) => {
      select(boxId);
      return controller.play();
    },
    [controller, select],
  );
  return { ...controller, pick, select, selectedBoxId };
}

export function useLuckyBox<TReward = unknown, TRequest = void>(
  options: UseLuckyBoxOptions<TReward, TRequest>,
): UseLuckyBoxReturn<TReward> {
  const controller = useLuckyBoxController(options, true);
  return {
    error: controller.error,
    pick: controller.pick,
    reset: controller.reset,
    result: controller.result,
    reveal: () => controller.play(),
    revealTo: controller.play,
    select: controller.select,
    selectedBoxId: controller.selectedBoxId,
    status:
      controller.selectedBoxId !== undefined && controller.status === 'ready'
        ? 'playing'
        : controller.status,
  };
}
