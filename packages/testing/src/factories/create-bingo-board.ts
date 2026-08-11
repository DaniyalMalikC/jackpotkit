import type { BingoBoard, BingoCellValue } from '@jackpotkit/core';

export type BingoCellFactory = (
  rowIndex: number,
  columnIndex: number,
  value: BingoCellValue,
) => BingoCellValue;

export interface CreateBingoBoardFixtureOptions {
  readonly freeSpace?: boolean;
  readonly startAt?: number;
}

export function createBingoBoardFixture(
  size = 5,
  options: CreateBingoBoardFixtureOptions = {},
  override: BingoCellFactory = (_row, _column, value) => value,
): BingoBoard {
  if (!Number.isInteger(size) || size < 2) {
    throw new RangeError('size must be an integer greater than or equal to 2.');
  }
  const { freeSpace = size % 2 === 1, startAt = 1 } = options;
  if (!Number.isSafeInteger(startAt)) throw new RangeError('startAt must be a safe integer.');
  if (freeSpace && size % 2 === 0) {
    throw new RangeError('freeSpace requires an odd fixture size.');
  }
  const center = Math.floor(size / 2);

  return Object.freeze(
    Array.from({ length: size }, (_, rowIndex) =>
      Object.freeze(
        Array.from({ length: size }, (_, columnIndex) => {
          const value =
            freeSpace && rowIndex === center && columnIndex === center
              ? 'free'
              : startAt + columnIndex * size + rowIndex;
          return override(rowIndex, columnIndex, value);
        }),
      ),
    ),
  );
}
