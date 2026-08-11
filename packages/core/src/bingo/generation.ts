import { MathRandomSource, nextRandomValue } from '../random/index.js';
import type { BingoBoard, CreateBingoBoardOptions } from './types.js';
import {
  assertValidBingoConfiguration,
  DEFAULT_BINGO_MAX_NUMBER,
  DEFAULT_BINGO_MIN_NUMBER,
  DEFAULT_BINGO_SIZE,
} from './validation.js';

function sample(
  values: readonly number[],
  count: number,
  randomSource: NonNullable<CreateBingoBoardOptions['randomSource']>,
): readonly number[] {
  const shuffled = [...values];
  for (let index = 0; index < count; index += 1) {
    const target = index + Math.floor(nextRandomValue(randomSource) * (shuffled.length - index));
    [shuffled[index], shuffled[target]] = [shuffled[target] as number, shuffled[index] as number];
  }
  return shuffled.slice(0, count).sort((left, right) => left - right);
}

export function createBingoBoard({
  size = DEFAULT_BINGO_SIZE,
  minNumber = DEFAULT_BINGO_MIN_NUMBER,
  maxNumber = DEFAULT_BINGO_MAX_NUMBER,
  freeSpace = true,
  randomSource = new MathRandomSource(),
}: CreateBingoBoardOptions = {}): BingoBoard {
  assertValidBingoConfiguration(size, minNumber, maxNumber, freeSpace);
  const available = maxNumber - minNumber + 1;
  const baseWidth = Math.floor(available / size);
  const widerColumns = available % size;
  const center = Math.floor(size / 2);
  let nextStart = minNumber;

  const columns = Array.from({ length: size }, (_, column) => {
    const width = baseWidth + (column < widerColumns ? 1 : 0);
    const values = Array.from({ length: width }, (_, index) => nextStart + index);
    nextStart += width;
    return sample(values, size - (freeSpace && column === center ? 1 : 0), randomSource);
  });

  const board = Array.from({ length: size }, (_, row) =>
    Object.freeze(
      Array.from({ length: size }, (_, column) => {
        if (freeSpace && row === center && column === center) return 'free';
        const sourceRow = freeSpace && column === center && row > center ? row - 1 : row;
        return columns[column]?.[sourceRow] as number;
      }),
    ),
  );
  return Object.freeze(board);
}
