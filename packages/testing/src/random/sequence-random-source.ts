import {
  GameStateError,
  InvalidConfigurationError,
  isRandomValue,
  type RandomSource,
} from '@jackpotkit/core';

export interface SequenceRandomSourceOptions {
  readonly loop?: boolean;
}

export class SequenceRandomSource implements RandomSource {
  readonly loop: boolean;
  readonly #values: readonly number[];
  #index = 0;

  constructor(values: readonly number[], options: SequenceRandomSourceOptions = {}) {
    if (values.length === 0) {
      throw new InvalidConfigurationError(
        'SequenceRandomSource requires at least one random value.',
      );
    }

    const invalidIndex = values.findIndex((value) => !isRandomValue(value));

    if (invalidIndex !== -1) {
      throw new InvalidConfigurationError(
        `SequenceRandomSource value at index ${invalidIndex} must be greater than or equal to 0 and less than 1.`,
        { metadata: { index: invalidIndex, value: values[invalidIndex] } },
      );
    }

    this.#values = Object.freeze([...values]);
    this.loop = options.loop ?? false;
  }

  get index(): number {
    return this.#index;
  }

  next(): number {
    if (this.#index >= this.#values.length) {
      if (!this.loop) {
        throw new GameStateError(
          'SequenceRandomSource is exhausted. Call reset(), provide more values, or enable looping.',
          { metadata: { length: this.#values.length } },
        );
      }

      this.#index = 0;
    }

    const value = this.#values[this.#index];

    if (value === undefined) {
      throw new GameStateError('SequenceRandomSource could not read its current value.');
    }

    this.#index += 1;
    return value;
  }

  reset(): void {
    this.#index = 0;
  }
}

export function createSequenceRandom(
  values: readonly number[],
  options: SequenceRandomSourceOptions = {},
): SequenceRandomSource {
  return new SequenceRandomSource(values, options);
}
