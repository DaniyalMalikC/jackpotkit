import { GameStateError } from '../errors/index.js';
import { resolveResult } from '../result/index.js';
import {
  assertValidScratchCardConfiguration,
  assertValidScratchCardSelection,
  assertValidScratchProgress,
} from './validation.js';
import type {
  CreateScratchCardOptions,
  ScratchCardEngine,
  ScratchCardProgressUpdate,
  ScratchCardResult,
  ScratchCardSelection,
} from './types.js';

function copySelection<TPrize>(
  selection: ScratchCardSelection<TPrize>,
): ScratchCardSelection<TPrize> {
  return Object.freeze({
    ...selection,
    ...(selection.metadata === undefined
      ? {}
      : { metadata: Object.freeze({ ...selection.metadata }) }),
  });
}

export function createScratchCard<TPrize = unknown>({
  threshold = 0.65,
  result: controlledResult,
  now = Date.now,
}: CreateScratchCardOptions<TPrize> = {}): ScratchCardEngine<TPrize> {
  assertValidScratchCardConfiguration({ threshold });
  if (controlledResult !== undefined) assertValidScratchCardSelection<TPrize>(controlledResult);

  let status: ScratchCardEngine<TPrize>['status'] = 'ready';
  let progress = 0;
  let result: ScratchCardResult<TPrize> | undefined;
  let playCount = 0;
  let operation = 0;
  let awaitingProvider = false;

  function createResult(selection: ScratchCardSelection<TPrize>): ScratchCardResult<TPrize> {
    const copied = copySelection(selection);
    const data = Object.freeze({
      ...(copied.prize === undefined ? {} : { prize: copied.prize }),
    });
    playCount += 1;

    result = Object.freeze({
      id: `scratch-card-${playCount}`,
      game: 'scratch-card',
      data,
      timestamp: now(),
      ...(copied.prize === undefined ? {} : { prize: copied.prize }),
      ...(copied.metadata === undefined ? {} : { metadata: copied.metadata }),
    });
    status = progress >= threshold ? 'completed' : 'playing';
    return result;
  }

  function start(
    suppliedSelection: ScratchCardSelection<TPrize> = controlledResult ?? {},
  ): ScratchCardResult<TPrize> {
    if (awaitingProvider) {
      throw new GameStateError('The Scratch Card is already requesting a result.');
    }

    if (result !== undefined) return result;

    try {
      assertValidScratchCardSelection<TPrize>(suppliedSelection);
      status = 'playing';
      return createResult(suppliedSelection);
    } catch (error) {
      status = 'error';
      throw error;
    }
  }

  function scratch(nextProgress: number): ScratchCardProgressUpdate {
    assertValidScratchProgress(nextProgress);
    progress = Math.max(progress, nextProgress);

    if (status === 'ready') start();
    if (!awaitingProvider && result !== undefined && progress >= threshold) status = 'completed';

    return Object.freeze({ progress, completed: status === 'completed' });
  }

  return {
    threshold,
    get status() {
      return status;
    },
    get progress() {
      return progress;
    },
    get result() {
      return result;
    },
    start,
    async startWith(provider, request) {
      if (result !== undefined) return result;
      if (awaitingProvider) {
        throw new GameStateError('The Scratch Card is already requesting a result.');
      }

      awaitingProvider = true;
      status = 'requesting-result';
      const currentOperation = ++operation;

      try {
        const selection: unknown = await resolveResult(provider, request);
        if (currentOperation !== operation) {
          throw new GameStateError('The Scratch Card was reset before its result resolved.');
        }

        assertValidScratchCardSelection<TPrize>(selection);
        return createResult(selection);
      } catch (error) {
        if (currentOperation === operation) status = 'error';
        throw error;
      } finally {
        if (currentOperation === operation) awaitingProvider = false;
      }
    },
    scratch,
    reveal() {
      if (awaitingProvider) {
        throw new GameStateError('Wait for the Scratch Card result before revealing it.');
      }

      const revealedResult = result ?? start();
      progress = 1;
      status = 'completed';
      return revealedResult;
    },
    reset() {
      operation += 1;
      awaitingProvider = false;
      progress = 0;
      result = undefined;
      status = 'ready';
    },
  };
}
