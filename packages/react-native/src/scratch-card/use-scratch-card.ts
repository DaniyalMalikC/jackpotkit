import {
  GameStateError,
  createGameEvent,
  createScratchCard,
  type GameStatus,
  type ScratchCardProgressUpdate,
  type ScratchCardResult,
} from '@jackpotkit/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ScratchCardEventPayload, UseScratchCardOptions, UseScratchCardReturn } from './types';

interface ScratchCardController<TPrize> extends UseScratchCardReturn<TPrize> {
  complete(result: ScratchCardResult<TPrize>): void;
  finishReveal(result: ScratchCardResult<TPrize>): void;
  startReveal(result: ScratchCardResult<TPrize>): void;
}

function useScratchCardController<TPrize, TRequest>(
  options: UseScratchCardOptions<TPrize, TRequest>,
  completeAutomatically: boolean,
): ScratchCardController<TPrize> {
  const {
    disabled = false,
    onComplete,
    onError,
    onEvent,
    onPlayStart,
    onProgress,
    onReady,
    onReset,
    onResultRequest,
    onResultResolved,
    onRevealStart,
    onStatusChange,
    result: controlledResult,
    resultProvider,
    resultRequest,
    threshold = 0.65,
  } = options;
  const engine = useMemo(
    () =>
      createScratchCard({
        threshold,
        ...(controlledResult === undefined ? {} : { result: controlledResult }),
      }),
    [controlledResult, threshold],
  );
  const [status, setStatus] = useState<GameStatus>('ready');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScratchCardResult<TPrize> | undefined>();
  const [error, setError] = useState<unknown>();
  const operationRef = useRef(0);
  const beginPromiseRef = useRef<Promise<ScratchCardResult<TPrize>> | undefined>(undefined);
  const completedRef = useRef(false);
  const readyEmittedRef = useRef(false);

  const emit = useCallback(
    (type: Parameters<typeof createGameEvent>[0], payload: ScratchCardEventPayload<TPrize>) => {
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

  const fail = useCallback(
    (caught: unknown) => {
      setError(caught);
      updateStatus('error');
      emit('error', { error: caught });
      onError?.(caught);
    },
    [emit, onError, updateStatus],
  );

  const finishReveal = useCallback(
    (completedResult: ScratchCardResult<TPrize>) => {
      updateStatus('completed');
      if (completedRef.current) return;
      completedRef.current = true;
      emit('complete', { result: completedResult });
      onComplete?.(completedResult);
    },
    [emit, onComplete, updateStatus],
  );

  const complete = useCallback(
    (completedResult: ScratchCardResult<TPrize>) => {
      if (!completedRef.current) finishReveal(completedResult);
    },
    [finishReveal],
  );

  const startReveal = useCallback(
    (revealedResult: ScratchCardResult<TPrize>) => {
      updateStatus('revealing');
      emit('reveal-start', { result: revealedResult });
      onRevealStart?.(revealedResult);
    },
    [emit, onRevealStart, updateStatus],
  );

  const begin = useCallback(async (): Promise<ScratchCardResult<TPrize>> => {
    if (disabled) {
      const disabledError = new GameStateError('The Scratch Card is disabled.');
      fail(disabledError);
      throw disabledError;
    }

    if (engine.result !== undefined) return engine.result;
    if (beginPromiseRef.current !== undefined) return beginPromiseRef.current;

    const operation = operationRef.current;
    setError(undefined);
    updateStatus('playing');
    emit('play-start', {});
    onPlayStart?.();

    const promise = (async () => {
      try {
        let resolved: ScratchCardResult<TPrize>;

        if (resultProvider !== undefined) {
          updateStatus('requesting-result');
          emit('result-request', {});
          onResultRequest?.();
          resolved = await engine.startWith(resultProvider, resultRequest as TRequest);
        } else {
          resolved = engine.start();
        }

        if (operation !== operationRef.current) {
          throw new GameStateError('The Scratch Card was reset before its result resolved.');
        }

        setResult(resolved);
        emit('result-resolved', { result: resolved });
        onResultResolved?.(resolved);

        if (engine.status === 'completed' && completeAutomatically) complete(resolved);
        else updateStatus('playing');

        return resolved;
      } catch (caught) {
        if (operation === operationRef.current) fail(caught);
        throw caught;
      } finally {
        if (operation === operationRef.current) beginPromiseRef.current = undefined;
      }
    })();

    beginPromiseRef.current = promise;
    return promise;
  }, [
    complete,
    completeAutomatically,
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
  ]);

  const scratch = useCallback(
    (nextProgress: number): ScratchCardProgressUpdate => {
      if (disabled) {
        const disabledError = new GameStateError('The Scratch Card is disabled.');
        fail(disabledError);
        throw disabledError;
      }

      if (engine.status === 'ready') void begin().catch(() => undefined);
      const update = engine.scratch(nextProgress);
      setProgress(update.progress);
      emit('progress', {
        progress: update.progress,
        ...(engine.result === undefined ? {} : { result: engine.result }),
      });
      onProgress?.(update.progress);

      if (update.completed && engine.result !== undefined && completeAutomatically) {
        complete(engine.result);
      }

      return update;
    },
    [begin, complete, completeAutomatically, disabled, emit, engine, fail, onProgress],
  );

  const reveal = useCallback(async (): Promise<ScratchCardResult<TPrize>> => {
    const resolved = await begin();
    const revealed = engine.reveal();
    setProgress(1);
    emit('progress', { progress: 1, result: revealed });
    onProgress?.(1);
    startReveal(revealed);
    if (completeAutomatically) complete(revealed);
    return resolved;
  }, [begin, complete, completeAutomatically, emit, engine, onProgress, startReveal]);

  const reset = useCallback(() => {
    operationRef.current += 1;
    beginPromiseRef.current = undefined;
    completedRef.current = false;
    engine.reset();
    setError(undefined);
    setProgress(0);
    setResult(undefined);
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
    begin,
    complete,
    error,
    finishReveal,
    progress,
    reset,
    result,
    reveal,
    scratch,
    startReveal,
    status: disabled ? 'disabled' : status,
  };
}

export function useScratchCard<TPrize = unknown, TRequest = void>(
  options: UseScratchCardOptions<TPrize, TRequest>,
): UseScratchCardReturn<TPrize> {
  return useScratchCardController(options, true);
}

export { useScratchCardController };
