import {
  GameStateError,
  createGameEvent,
  createSpinWheel,
  type GameStatus,
  type SpinWheelResult,
} from '@jackpotkit/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { SpinWheelEventPayload, UseSpinWheelOptions, UseSpinWheelReturn } from './types';

interface SpinWheelController<TValue> extends UseSpinWheelReturn<TValue> {
  complete(result: SpinWheelResult<TValue>): void;
  reveal(result: SpinWheelResult<TValue>): void;
  startAnimation(result: SpinWheelResult<TValue>): void;
}

function useSpinWheelController<TValue, TRequest>(
  options: UseSpinWheelOptions<TValue, TRequest>,
  completeOnResolve: boolean,
): SpinWheelController<TValue> {
  const {
    disabled = false,
    onComplete,
    onAnimationStart,
    onError,
    onEvent,
    onPlayStart,
    onReady,
    onRevealStart,
    onReset,
    onResultRequest,
    onResultResolved,
    onStatusChange,
    randomSource,
    result: controlledResult,
    resultProvider,
    resultRequest,
    segments,
  } = options;
  const engine = useMemo(
    () =>
      createSpinWheel({
        segments,
        ...(randomSource === undefined ? {} : { randomSource }),
      }),
    [randomSource, segments],
  );
  const [status, setStatus] = useState<GameStatus>('ready');
  const [result, setResult] = useState<SpinWheelResult<TValue> | undefined>();
  const [error, setError] = useState<unknown>();
  const busyRef = useRef(false);
  const operationRef = useRef(0);
  const readyEmittedRef = useRef(false);

  const emit = useCallback(
    (type: Parameters<typeof createGameEvent>[0], payload: SpinWheelEventPayload<TValue>) => {
      onEvent?.(createGameEvent(type, payload));
    },
    [onEvent],
  );

  const updateStatus = useCallback(
    (nextStatus: GameStatus) => {
      setStatus(nextStatus);
      onStatusChange?.(nextStatus);
    },
    [onStatusChange],
  );

  const complete = useCallback(
    (completedResult: SpinWheelResult<TValue>) => {
      updateStatus('completed');
      emit('complete', { result: completedResult });
      onComplete?.(completedResult);
    },
    [emit, onComplete, updateStatus],
  );

  const startAnimation = useCallback(
    (animationResult: SpinWheelResult<TValue>) => {
      emit('animation-start', { result: animationResult });
      onAnimationStart?.(animationResult);
    },
    [emit, onAnimationStart],
  );

  const reveal = useCallback(
    (revealedResult: SpinWheelResult<TValue>) => {
      updateStatus('revealing');
      emit('reveal-start', { result: revealedResult });
      onRevealStart?.(revealedResult);
    },
    [emit, onRevealStart, updateStatus],
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

  const resolvePlay = useCallback(
    async (segmentId?: string): Promise<SpinWheelResult<TValue>> => {
      if (disabled) {
        const disabledError = new GameStateError('The Spin Wheel is disabled.');
        fail(disabledError);
        throw disabledError;
      }

      if (busyRef.current) {
        const busyError = new GameStateError('The Spin Wheel is already resolving a play.');
        fail(busyError);
        throw busyError;
      }

      busyRef.current = true;
      const operation = ++operationRef.current;
      setError(undefined);
      updateStatus('playing');
      emit('play-start', {});
      onPlayStart?.();

      try {
        let resolved: SpinWheelResult<TValue>;

        if (segmentId !== undefined) {
          resolved = engine.spinTo(segmentId);
        } else if (controlledResult !== undefined) {
          resolved = engine.spinTo(controlledResult.segmentId);
        } else if (resultProvider !== undefined) {
          updateStatus('requesting-result');
          emit('result-request', {});
          onResultRequest?.();
          resolved = await engine.spinWith(resultProvider, resultRequest as TRequest);
        } else {
          resolved = engine.spin();
        }

        setResult(resolved);
        updateStatus('playing');
        emit('result-resolved', { result: resolved });
        onResultResolved?.(resolved);

        if (completeOnResolve) {
          complete(resolved);
        }

        return resolved;
      } catch (caught) {
        if (operation === operationRef.current) {
          fail(caught);
        }
        throw caught;
      } finally {
        if (operation === operationRef.current) {
          busyRef.current = false;
        }
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

  const spin = useCallback(() => resolvePlay(), [resolvePlay]);
  const spinTo = useCallback((segmentId: string) => resolvePlay(segmentId), [resolvePlay]);

  const reset = useCallback(() => {
    operationRef.current += 1;
    busyRef.current = false;
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
    reset,
    result,
    reveal,
    spin,
    spinTo,
    startAnimation,
    status: disabled ? 'disabled' : status,
  };
}

export function useSpinWheel<TValue = unknown, TRequest = void>(
  options: UseSpinWheelOptions<TValue, TRequest>,
): UseSpinWheelReturn<TValue> {
  return useSpinWheelController(options, true);
}

export { useSpinWheelController };
