import {
  GameStateError,
  createGameEvent,
  createSlotMachine,
  type GameStatus,
  type SlotMachineResult,
  type SlotMachineSelection,
} from '@jackpotkit/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { SlotMachineEventPayload, UseSlotMachineOptions, UseSlotMachineReturn } from './types';

interface SlotMachineController<TValue, TEvaluation> extends UseSlotMachineReturn<
  TValue,
  TEvaluation
> {
  complete(result: SlotMachineResult<TValue, TEvaluation>): void;
  reelStop(reelIndex: number, result: SlotMachineResult<TValue, TEvaluation>): void;
  reveal(result: SlotMachineResult<TValue, TEvaluation>): void;
  startAnimation(result: SlotMachineResult<TValue, TEvaluation>): void;
}

function useSlotMachineController<TValue, TEvaluation, TRequest>(
  options: UseSlotMachineOptions<TValue, TEvaluation, TRequest>,
  completeOnResolve: boolean,
): SlotMachineController<TValue, TEvaluation> {
  const {
    disabled = false,
    evaluate,
    onAnimationStart,
    onComplete,
    onError,
    onEvent,
    onPlayStart,
    onReady,
    onReelStop,
    onReset,
    onResultRequest,
    onResultResolved,
    onRevealStart,
    onStatusChange,
    paylines,
    randomSource,
    reelCount,
    result: controlledResult,
    resultProvider,
    resultRequest,
    rowCount,
    symbols,
  } = options;
  const engine = useMemo(
    () =>
      createSlotMachine({
        symbols,
        reelCount,
        ...(rowCount === undefined ? {} : { rowCount }),
        ...(paylines === undefined ? {} : { paylines }),
        ...(randomSource === undefined ? {} : { randomSource }),
        ...(evaluate === undefined ? {} : { evaluate }),
      }),
    [evaluate, paylines, randomSource, reelCount, rowCount, symbols],
  );
  const [status, setStatus] = useState<GameStatus>('ready');
  const [result, setResult] = useState<SlotMachineResult<TValue, TEvaluation>>();
  const [error, setError] = useState<unknown>();
  const busyRef = useRef(false);
  const operationRef = useRef(0);
  const completedRef = useRef(false);
  const readyEmittedRef = useRef(false);

  const emit = useCallback(
    (
      type: Parameters<typeof createGameEvent>[0],
      payload: SlotMachineEventPayload<TValue, TEvaluation>,
    ) => onEvent?.(createGameEvent(type, payload)),
    [onEvent],
  );
  const updateStatus = useCallback(
    (nextStatus: GameStatus) => {
      setStatus(nextStatus);
      onStatusChange?.(nextStatus);
    },
    [onStatusChange],
  );
  const fail = useCallback(
    (caught: unknown) => {
      setError(caught);
      updateStatus('error');
      emit('error', { error: caught });
      onError?.(caught);
    },
    [emit, onError, updateStatus],
  );
  const complete = useCallback(
    (completedResult: SlotMachineResult<TValue, TEvaluation>) => {
      if (completedRef.current) return;
      completedRef.current = true;
      updateStatus('completed');
      emit('complete', { result: completedResult });
      onComplete?.(completedResult);
    },
    [emit, onComplete, updateStatus],
  );
  const startAnimation = useCallback(
    (animationResult: SlotMachineResult<TValue, TEvaluation>) => {
      emit('animation-start', { result: animationResult });
      onAnimationStart?.(animationResult);
    },
    [emit, onAnimationStart],
  );
  const reelStop = useCallback(
    (reelIndex: number, stoppedResult: SlotMachineResult<TValue, TEvaluation>) => {
      emit('reel-stop', { reelIndex, result: stoppedResult });
      onReelStop?.(reelIndex, stoppedResult);
    },
    [emit, onReelStop],
  );
  const reveal = useCallback(
    (revealedResult: SlotMachineResult<TValue, TEvaluation>) => {
      updateStatus('revealing');
      emit('reveal-start', { result: revealedResult });
      onRevealStart?.(revealedResult);
    },
    [emit, onRevealStart, updateStatus],
  );

  const resolvePlay = useCallback(
    async (selection?: SlotMachineSelection): Promise<SlotMachineResult<TValue, TEvaluation>> => {
      if (disabled) {
        const caught = new GameStateError('The Slot Machine is disabled.');
        fail(caught);
        throw caught;
      }
      if (busyRef.current) {
        const caught = new GameStateError('The Slot Machine is already resolving a play.');
        fail(caught);
        throw caught;
      }

      busyRef.current = true;
      completedRef.current = false;
      const operation = ++operationRef.current;
      setError(undefined);
      updateStatus('playing');
      emit('play-start', {});
      onPlayStart?.();

      try {
        let resolved: SlotMachineResult<TValue, TEvaluation>;
        if (selection !== undefined) resolved = engine.spinTo(selection);
        else if (controlledResult !== undefined) resolved = engine.spinTo(controlledResult);
        else if (resultProvider !== undefined) {
          updateStatus('requesting-result');
          emit('result-request', {});
          onResultRequest?.();
          resolved = await engine.spinWith(resultProvider, resultRequest as TRequest);
        } else resolved = engine.spin();

        if (operation !== operationRef.current) {
          throw new GameStateError('The Slot Machine was reset before its result resolved.');
        }
        setResult(resolved);
        updateStatus('playing');
        emit('result-resolved', { result: resolved });
        onResultResolved?.(resolved);
        if (completeOnResolve) complete(resolved);
        return resolved;
      } catch (caught) {
        if (operation === operationRef.current) fail(caught);
        throw caught;
      } finally {
        if (operation === operationRef.current) busyRef.current = false;
      }
    },
    [
      complete,
      completeOnResolve,
      controlledResult,
      disabled,
      emit,
      engine,
      fail,
      onPlayStart,
      onResultRequest,
      onResultResolved,
      resultProvider,
      resultRequest,
      updateStatus,
    ],
  );

  const reset = useCallback(() => {
    operationRef.current += 1;
    busyRef.current = false;
    completedRef.current = false;
    engine.reset();
    setResult(undefined);
    setError(undefined);
    updateStatus('ready');
    emit('reset', {});
    onReset?.();
  }, [emit, engine, onReset, updateStatus]);

  useEffect(() => {
    if (!readyEmittedRef.current) {
      readyEmittedRef.current = true;
      emit('ready', {});
      onReady?.();
    }
  }, [emit, onReady]);

  return {
    complete,
    error,
    reelStop,
    reset,
    result,
    reveal,
    spin: () => resolvePlay(),
    spinTo: resolvePlay,
    startAnimation,
    status: disabled ? 'disabled' : status,
  };
}

export function useSlotMachine<TValue = unknown, TEvaluation = unknown, TRequest = void>(
  options: UseSlotMachineOptions<TValue, TEvaluation, TRequest>,
): UseSlotMachineReturn<TValue, TEvaluation> {
  return useSlotMachineController(options, true);
}

export { useSlotMachineController };
