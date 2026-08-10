import type { RandomSource } from './random-source.js';

export class MathRandomSource implements RandomSource {
  next(): number {
    return Math.random();
  }
}
