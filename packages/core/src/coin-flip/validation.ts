import { InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import type { CoinFace, CoinFlipSelection } from './types.js';

export const DEFAULT_COIN_FACES = Object.freeze([
  Object.freeze({ id: 'heads', label: 'Heads', value: 'heads' }),
  Object.freeze({ id: 'tails', label: 'Tails', value: 'tails' }),
]);

export function assertValidCoinFaces<TValue>(faces: readonly CoinFace<TValue>[]): void {
  if (!Array.isArray(faces) || faces.length !== 2) {
    throw new InvalidConfigurationError('Coin Flip requires exactly two faces.');
  }
  const ids = new Set<string>();
  for (const [index, face] of faces.entries()) {
    if (typeof face?.id !== 'string' || face.id.trim().length === 0) {
      throw new InvalidConfigurationError(`Coin face ${index + 1} must have a non-empty ID.`);
    }
    if (ids.has(face.id)) {
      throw new InvalidConfigurationError(`Coin Flip contains duplicate face ID "${face.id}".`);
    }
    ids.add(face.id);
  }
}

export function assertValidCoinFlipSelection<TValue>(
  faces: readonly CoinFace<TValue>[],
  selection: unknown,
): asserts selection is CoinFlipSelection {
  if (
    typeof selection !== 'object' ||
    selection === null ||
    !('faceId' in selection) ||
    typeof selection.faceId !== 'string'
  ) {
    throw new InvalidResultError('A Coin Flip selection must contain a faceId string.');
  }
  if (!faces.some((face) => face.id === selection.faceId)) {
    throw new InvalidResultError(`Unknown Coin Flip face ID "${selection.faceId}".`);
  }
  if (
    'metadata' in selection &&
    selection.metadata !== undefined &&
    (typeof selection.metadata !== 'object' || selection.metadata === null)
  ) {
    throw new InvalidResultError('Coin Flip result metadata must be an object when supplied.');
  }
}
