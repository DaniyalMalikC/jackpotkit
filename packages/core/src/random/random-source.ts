import { InvalidResultError } from '../errors/index.js';

export interface RandomSource {
  next(): number;
}

export function isRandomValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 1;
}

export function assertRandomValue(
  value: unknown,
  sourceName = 'RandomSource',
): asserts value is number {
  if (!isRandomValue(value)) {
    throw new InvalidResultError(
      `${sourceName}.next() must return a finite number greater than or equal to 0 and less than 1.`,
      { metadata: { sourceName, value } },
    );
  }
}

export function nextRandomValue(randomSource: RandomSource): number {
  const value: unknown = randomSource.next();
  assertRandomValue(value, randomSource.constructor.name || 'RandomSource');
  return value;
}
