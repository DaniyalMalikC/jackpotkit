import { GameStateError } from '../errors/index.js';
import { MathRandomSource, nextRandomValue } from '../random/index.js';
import { resolveResult } from '../result/index.js';
import type {
  CoinFace,
  CoinFlipEngine,
  CoinFlipResult,
  CoinFlipSelection,
  CreateCoinFlipOptions,
} from './types.js';
import {
  assertValidCoinFaces,
  assertValidCoinFlipSelection,
  DEFAULT_COIN_FACES,
} from './validation.js';

function copyFace<TValue>(face: CoinFace<TValue>): CoinFace<TValue> {
  return Object.freeze({
    ...face,
    ...(face.metadata === undefined ? {} : { metadata: Object.freeze({ ...face.metadata }) }),
  });
}

export function createCoinFlip<TValue = string>({
  faces: suppliedFaces = DEFAULT_COIN_FACES as readonly CoinFace<TValue>[],
  randomSource = new MathRandomSource(),
  now = Date.now,
}: CreateCoinFlipOptions<TValue> = {}): CoinFlipEngine<TValue> {
  assertValidCoinFaces(suppliedFaces);
  const faces = Object.freeze(suppliedFaces.map(copyFace));
  let status: CoinFlipEngine<TValue>['status'] = 'ready';
  let result: CoinFlipResult<TValue> | undefined;
  let playCount = 0;
  let operation = 0;
  let awaitingProvider = false;

  function assertCanFlip(): void {
    if (awaitingProvider) throw new GameStateError('Coin Flip is already requesting a result.');
  }

  function complete(selection: CoinFlipSelection): CoinFlipResult<TValue> {
    assertValidCoinFlipSelection(faces, selection);
    const face = faces.find((candidate) => candidate.id === selection.faceId) as CoinFace<TValue>;
    const data = Object.freeze({
      faceId: face.id,
      ...(face.value === undefined ? {} : { value: face.value }),
    });
    playCount += 1;
    result = Object.freeze({
      id: `coin-flip-${playCount}`,
      game: 'coin-flip',
      data,
      timestamp: now(),
      faceId: face.id,
      face,
      ...(selection.metadata === undefined
        ? {}
        : { metadata: Object.freeze({ ...selection.metadata }) }),
    });
    status = 'completed';
    return result;
  }

  return {
    faces,
    get status() {
      return status;
    },
    get result() {
      return result;
    },
    flip() {
      assertCanFlip();
      status = 'playing';
      try {
        return complete({
          faceId: faces[nextRandomValue(randomSource) < 0.5 ? 0 : 1]?.id as string,
        });
      } catch (error) {
        status = 'error';
        throw error;
      }
    },
    flipTo(selection) {
      assertCanFlip();
      status = 'playing';
      try {
        return complete(selection);
      } catch (error) {
        status = 'error';
        throw error;
      }
    },
    async flipWith(provider, request) {
      assertCanFlip();
      awaitingProvider = true;
      status = 'requesting-result';
      const currentOperation = ++operation;
      try {
        const selection: unknown = await resolveResult(provider, request);
        if (currentOperation !== operation) {
          throw new GameStateError('Coin Flip was reset before its result resolved.');
        }
        assertValidCoinFlipSelection(faces, selection);
        status = 'playing';
        return complete(selection);
      } catch (error) {
        if (currentOperation === operation) status = 'error';
        throw error;
      } finally {
        if (currentOperation === operation) awaitingProvider = false;
      }
    },
    reset() {
      operation += 1;
      awaitingProvider = false;
      result = undefined;
      status = 'ready';
    },
  };
}
