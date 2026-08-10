import { GameStateError, InvalidSegmentError } from '../errors/index.js';
import { MathRandomSource } from '../random/index.js';
import { resolveResult } from '../result/index.js';
import { selectSpinWheelSegment } from './selection.js';
import { assertValidSpinWheelSegments, assertValidSpinWheelSelection } from './validation.js';
import type {
  CreateSpinWheelOptions,
  SpinWheelEngine,
  SpinWheelResult,
  WheelSegment,
} from './types.js';

function copySegment<TValue>(segment: WheelSegment<TValue>): WheelSegment<TValue> {
  return Object.freeze({
    ...segment,
    ...(segment.metadata === undefined ? {} : { metadata: Object.freeze({ ...segment.metadata }) }),
  });
}

export function createSpinWheel<TValue = unknown>({
  segments: suppliedSegments,
  randomSource = new MathRandomSource(),
  now = Date.now,
}: CreateSpinWheelOptions<TValue>): SpinWheelEngine<TValue> {
  assertValidSpinWheelSegments(suppliedSegments);

  const segments = Object.freeze(suppliedSegments.map(copySegment));
  let status: SpinWheelEngine<TValue>['status'] = 'ready';
  let result: SpinWheelResult<TValue> | undefined;
  let playCount = 0;
  let operation = 0;
  let awaitingProvider = false;

  function assertCanPlay(): void {
    if (awaitingProvider) {
      throw new GameStateError(
        'The Spin Wheel is already requesting a result. Wait for it to finish or reset it.',
      );
    }
  }

  function complete(segment: WheelSegment<TValue>): SpinWheelResult<TValue> {
    playCount += 1;
    const data = Object.freeze({
      segmentId: segment.id,
      ...(segment.value === undefined ? {} : { value: segment.value }),
    });

    result = Object.freeze({
      id: `spin-wheel-${playCount}`,
      game: 'spin-wheel',
      data,
      timestamp: now(),
      segmentId: segment.id,
      segment,
    });
    status = 'completed';
    return result;
  }

  function findSegment(segmentId: string): WheelSegment<TValue> {
    assertValidSpinWheelSelection(segments, { segmentId });
    const segment = segments.find((candidate) => candidate.id === segmentId);

    if (segment === undefined) {
      throw new InvalidSegmentError(`No Spin Wheel segment has ID "${segmentId}".`);
    }

    return segment;
  }

  const engine: SpinWheelEngine<TValue> = {
    segments,
    get status() {
      return status;
    },
    get result() {
      return result;
    },
    spin() {
      assertCanPlay();
      status = 'playing';

      try {
        return complete(selectSpinWheelSegment(segments, randomSource));
      } catch (error) {
        status = 'error';
        throw error;
      }
    },
    spinTo(segmentId) {
      assertCanPlay();
      status = 'playing';

      try {
        return complete(findSegment(segmentId));
      } catch (error) {
        status = 'error';
        throw error;
      }
    },
    async spinWith(provider, request) {
      assertCanPlay();
      awaitingProvider = true;
      status = 'requesting-result';
      const currentOperation = ++operation;

      try {
        const selection: unknown = await resolveResult(provider, request);

        if (currentOperation !== operation) {
          throw new GameStateError('The Spin Wheel was reset before its result resolved.');
        }

        assertValidSpinWheelSelection(segments, selection);
        status = 'playing';
        return complete(findSegment(selection.segmentId));
      } catch (error) {
        if (currentOperation === operation) {
          status = 'error';
        }

        throw error;
      } finally {
        if (currentOperation === operation) {
          awaitingProvider = false;
        }
      }
    },
    reset() {
      operation += 1;
      awaitingProvider = false;
      result = undefined;
      status = 'ready';
    },
  };

  return engine;
}
