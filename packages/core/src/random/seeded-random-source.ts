import { InvalidConfigurationError } from '../errors/index.js';
import type { RandomSource } from './random-source.js';

const UINT32_RANGE = 4_294_967_296;
const FNV_OFFSET_BASIS = 2_166_136_261;
const FNV_PRIME = 16_777_619;
const MULBERRY_INCREMENT = 0x6d2b79f5;

export type RandomSeed = number | string;

function hashString(seed: string): number {
  let hash = FNV_OFFSET_BASIS;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}

function normalizeSeed(seed: RandomSeed): number {
  if (typeof seed === 'string') {
    return hashString(seed);
  }

  if (!Number.isSafeInteger(seed)) {
    throw new InvalidConfigurationError(
      'SeededRandomSource requires a string or a safe integer seed.',
      { metadata: { seed } },
    );
  }

  return seed >>> 0;
}

export class SeededRandomSource implements RandomSource {
  readonly seed: RandomSeed;
  #initialState: number;
  #state: number;

  constructor(seed: RandomSeed) {
    this.seed = seed;
    this.#initialState = normalizeSeed(seed);
    this.#state = this.#initialState;
  }

  next(): number {
    this.#state = (this.#state + MULBERRY_INCREMENT) >>> 0;

    let value = this.#state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
  }

  reset(): void {
    this.#state = this.#initialState;
  }
}
