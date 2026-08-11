import { GameStateError, createBingo, createGameEvent, type BingoState } from '@jackpotkit/core';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import type { BingoEventPayload, UseBingoOptions, UseBingoReturn } from './types';

export function useBingo(options: UseBingoOptions = {}): UseBingoReturn {
  const {
    board,
    disabled = false,
    freeSpace,
    maxNumber,
    minNumber,
    now,
    onCall,
    onComplete,
    onError,
    onEvent,
    onMark,
    onReady,
    onReset,
    onStatusChange,
    onUnmark,
    patterns,
    randomSource,
    size,
  } = options;
  const engine = useMemo(
    () =>
      createBingo({
        ...(board === undefined ? {} : { board }),
        ...(freeSpace === undefined ? {} : { freeSpace }),
        ...(maxNumber === undefined ? {} : { maxNumber }),
        ...(minNumber === undefined ? {} : { minNumber }),
        ...(now === undefined ? {} : { now }),
        ...(patterns === undefined ? {} : { patterns }),
        ...(randomSource === undefined ? {} : { randomSource }),
        ...(size === undefined ? {} : { size }),
      }),
    [board, freeSpace, maxNumber, minNumber, now, patterns, randomSource, size],
  );
  const [, forceUpdate] = useReducer((version: number) => version + 1, 0);
  const [failure, setFailure] = useState<{
    readonly engine: typeof engine;
    readonly error: unknown;
  }>();
  const error = failure?.engine === engine ? failure.error : undefined;
  const completedResultRef = useRef<string | undefined>(undefined);
  const readyEngineRef = useRef<typeof engine | undefined>(undefined);

  const emit = useCallback(
    (type: Parameters<typeof createGameEvent>[0], payload: BingoEventPayload) =>
      onEvent?.(createGameEvent(type, payload)),
    [onEvent],
  );
  const publish = useCallback(
    (nextState: BingoState) => {
      forceUpdate();
      setFailure(undefined);
      onStatusChange?.(disabled ? 'disabled' : nextState.status);
      if (engine.result !== undefined && completedResultRef.current !== engine.result.id) {
        completedResultRef.current = engine.result.id;
        emit('complete', { result: engine.result, state: nextState });
        onComplete?.(engine.result);
      } else if (!nextState.completed) {
        completedResultRef.current = undefined;
      }
      return nextState;
    },
    [disabled, emit, engine, onComplete, onStatusChange],
  );
  const fail = useCallback(
    (caught: unknown): never => {
      setFailure({ engine, error: caught });
      onStatusChange?.('error');
      emit('error', { error: caught });
      onError?.(caught);
      throw caught;
    },
    [emit, engine, onError, onStatusChange],
  );
  const assertEnabled = useCallback(() => {
    if (disabled) fail(new GameStateError('Bingo is disabled.'));
  }, [disabled, fail]);
  const call = useCallback(
    (number: number) => {
      assertEnabled();
      try {
        const nextState = publish(engine.call(number));
        emit('number-call', { number, state: nextState });
        onCall?.(number, nextState);
        return nextState;
      } catch (caught) {
        return fail(caught);
      }
    },
    [assertEnabled, emit, engine, fail, onCall, publish],
  );
  const draw = useCallback(() => {
    assertEnabled();
    try {
      const number = engine.draw();
      const nextState = publish(engine.state);
      emit('number-call', { number, state: nextState });
      onCall?.(number, nextState);
      return number;
    } catch (caught) {
      return fail(caught);
    }
  }, [assertEnabled, emit, engine, fail, onCall, publish]);
  const mark = useCallback(
    (number: number) => {
      assertEnabled();
      try {
        const nextState = publish(engine.mark(number));
        emit('mark', { number, state: nextState });
        onMark?.(number, nextState);
        return nextState;
      } catch (caught) {
        return fail(caught);
      }
    },
    [assertEnabled, emit, engine, fail, onMark, publish],
  );
  const unmark = useCallback(
    (number: number) => {
      assertEnabled();
      try {
        const nextState = publish(engine.unmark(number));
        emit('unmark', { number, state: nextState });
        onUnmark?.(number, nextState);
        return nextState;
      } catch (caught) {
        return fail(caught);
      }
    },
    [assertEnabled, emit, engine, fail, onUnmark, publish],
  );
  const toggleMark = useCallback(
    (number: number) =>
      engine.state.markedNumbers.includes(number) ? unmark(number) : mark(number),
    [engine, mark, unmark],
  );
  const reset = useCallback(() => {
    completedResultRef.current = undefined;
    const nextState = engine.reset();
    forceUpdate();
    setFailure(undefined);
    onStatusChange?.(disabled ? 'disabled' : 'ready');
    emit('reset', { state: nextState });
    onReset?.();
    return nextState;
  }, [disabled, emit, engine, onReset, onStatusChange]);

  useEffect(() => {
    if (readyEngineRef.current === engine) return;
    readyEngineRef.current = engine;
    completedResultRef.current = undefined;
    emit('ready', { state: engine.state });
    onReady?.();
  }, [emit, engine, onReady]);

  return {
    board: engine.board,
    patterns: engine.patterns,
    state: engine.state,
    status: disabled ? 'disabled' : error === undefined ? engine.state.status : 'error',
    result: engine.result,
    error,
    call,
    draw,
    mark,
    unmark,
    toggleMark,
    check: () => engine.check(),
    reset,
  };
}
