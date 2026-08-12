import { GameStateError, createGameEvent, type GameEvent, type GameStatus } from '@jackpotkit/core';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface OneShotEventPayload<TResult> {
  readonly result?: TResult;
  readonly error?: unknown;
}

export interface OneShotCallbacks<TResult> {
  readonly onReady?: () => void;
  readonly onPlayStart?: () => void;
  readonly onResultRequest?: () => void;
  readonly onResultResolved?: (result: TResult) => void;
  readonly onAnimationStart?: (result: TResult) => void;
  readonly onRevealStart?: (result: TResult) => void;
  readonly onComplete?: (result: TResult) => void;
  readonly onReset?: () => void;
  readonly onError?: (error: unknown) => void;
  readonly onEvent?: (event: GameEvent<GameEvent['type'], OneShotEventPayload<TResult>>) => void;
  readonly onStatusChange?: (status: GameStatus) => void;
}

interface OneShotOptions<TResult, TSelection> extends OneShotCallbacks<TResult> {
  readonly gameName: string;
  readonly disabled: boolean;
  readonly completeOnResolve: boolean;
  readonly controlledSelection?: TSelection;
  readonly resolveRandom: () => TResult;
  readonly resolveControlled: (selection: TSelection) => TResult;
  readonly resolveProvider?: () => Promise<TResult>;
  readonly resetEngine: () => void;
}

export interface OneShotController<TResult, TSelection> {
  readonly status: GameStatus;
  readonly result: TResult | undefined;
  readonly error: unknown;
  play(selection?: TSelection): Promise<TResult>;
  reset(): void;
  startAnimation(result: TResult): void;
  reveal(result: TResult): void;
  complete(result: TResult): void;
}

export function useOneShotController<TResult, TSelection>(
  options: OneShotOptions<TResult, TSelection>,
): OneShotController<TResult, TSelection> {
  const {
    completeOnResolve,
    controlledSelection,
    disabled,
    gameName,
    onAnimationStart,
    onComplete,
    onError,
    onEvent,
    onPlayStart,
    onReady,
    onReset,
    onResultRequest,
    onResultResolved,
    onRevealStart,
    onStatusChange,
    resetEngine,
    resolveControlled,
    resolveProvider,
    resolveRandom,
  } = options;
  const [status, setStatus] = useState<GameStatus>('ready');
  const [result, setResult] = useState<TResult>();
  const [error, setError] = useState<unknown>();
  const busyRef = useRef(false);
  const operationRef = useRef(0);
  const completedRef = useRef(false);
  const readyRef = useRef(false);
  const emit = useCallback(
    (type: Parameters<typeof createGameEvent>[0], payload: OneShotEventPayload<TResult>) =>
      onEvent?.(createGameEvent(type, payload)),
    [onEvent],
  );
  const updateStatus = useCallback(
    (next: GameStatus) => {
      setStatus(next);
      onStatusChange?.(next);
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
    (value: TResult) => {
      if (completedRef.current) return;
      completedRef.current = true;
      updateStatus('completed');
      emit('complete', { result: value });
      onComplete?.(value);
    },
    [emit, onComplete, updateStatus],
  );
  const startAnimation = useCallback(
    (value: TResult) => {
      emit('animation-start', { result: value });
      onAnimationStart?.(value);
    },
    [emit, onAnimationStart],
  );
  const reveal = useCallback(
    (value: TResult) => {
      updateStatus('revealing');
      emit('reveal-start', { result: value });
      onRevealStart?.(value);
    },
    [emit, onRevealStart, updateStatus],
  );
  const play = useCallback(
    async (selection?: TSelection) => {
      if (disabled) {
        const caught = new GameStateError(`${gameName} is disabled.`);
        fail(caught);
        throw caught;
      }
      if (busyRef.current) {
        const caught = new GameStateError(`${gameName} is already resolving a play.`);
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
        let resolved: TResult;
        if (selection !== undefined) resolved = resolveControlled(selection);
        else if (controlledSelection !== undefined)
          resolved = resolveControlled(controlledSelection);
        else if (resolveProvider !== undefined) {
          updateStatus('requesting-result');
          emit('result-request', {});
          onResultRequest?.();
          resolved = await resolveProvider();
        } else resolved = resolveRandom();
        if (operation !== operationRef.current)
          throw new GameStateError(`${gameName} was reset before its result resolved.`);
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
      controlledSelection,
      disabled,
      emit,
      fail,
      gameName,
      onPlayStart,
      onResultRequest,
      onResultResolved,
      resolveControlled,
      resolveProvider,
      resolveRandom,
      updateStatus,
    ],
  );
  const reset = useCallback(() => {
    operationRef.current += 1;
    busyRef.current = false;
    completedRef.current = false;
    resetEngine();
    setResult(undefined);
    setError(undefined);
    updateStatus('ready');
    emit('reset', {});
    onReset?.();
  }, [emit, onReset, resetEngine, updateStatus]);
  useEffect(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    emit('ready', {});
    onReady?.();
  }, [emit, onReady]);
  return {
    complete,
    error,
    play,
    reset,
    result,
    reveal,
    startAnimation,
    status: disabled ? 'disabled' : status,
  };
}
