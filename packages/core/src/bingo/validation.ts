import { InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import type {
  BingoBoard,
  BingoCoordinate,
  BingoCustomPattern,
  BingoPattern,
  BingoPatternDefinition,
} from './types.js';

export const DEFAULT_BINGO_SIZE = 5;
export const DEFAULT_BINGO_MIN_NUMBER = 1;
export const DEFAULT_BINGO_MAX_NUMBER = 75;
export const DEFAULT_BINGO_PATTERNS = Object.freeze([
  'row',
  'column',
  'diagonal',
] as const satisfies readonly BingoPattern[]);

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new InvalidConfigurationError(`${label} must be a positive integer.`);
  }
}

function coordinateKey({ row, column }: BingoCoordinate): string {
  return `${row}:${column}`;
}

function freezeCells(cells: readonly BingoCoordinate[]): readonly BingoCoordinate[] {
  return Object.freeze(cells.map((cell) => Object.freeze({ ...cell })));
}

function createDefinition(
  id: string,
  kind: BingoPatternDefinition['kind'],
  label: string,
  cells: readonly BingoCoordinate[],
): BingoPatternDefinition {
  return Object.freeze({ id, kind, label, cells: freezeCells(cells) });
}

function assertValidCustomPattern(pattern: BingoCustomPattern, size: number): void {
  if (pattern.id.trim().length === 0) {
    throw new InvalidConfigurationError('A custom Bingo pattern ID cannot be empty.');
  }
  if (pattern.cells.length === 0) {
    throw new InvalidConfigurationError(`Bingo pattern "${pattern.id}" must contain a cell.`);
  }

  const coordinates = new Set<string>();
  for (const cell of pattern.cells) {
    if (
      !Number.isInteger(cell.row) ||
      !Number.isInteger(cell.column) ||
      cell.row < 0 ||
      cell.row >= size ||
      cell.column < 0 ||
      cell.column >= size
    ) {
      throw new InvalidConfigurationError(
        `Bingo pattern "${pattern.id}" contains an out-of-range cell.`,
      );
    }

    const key = coordinateKey(cell);
    if (coordinates.has(key)) {
      throw new InvalidConfigurationError(
        `Bingo pattern "${pattern.id}" contains duplicate cell ${key}.`,
      );
    }
    coordinates.add(key);
  }
}

export function assertValidBingoConfiguration(
  size: number,
  minNumber: number,
  maxNumber: number,
  freeSpace: boolean,
): void {
  assertPositiveInteger(size, 'Bingo size');
  if (size < 2) throw new InvalidConfigurationError('Bingo size must be at least 2.');
  if (!Number.isSafeInteger(minNumber) || !Number.isSafeInteger(maxNumber)) {
    throw new InvalidConfigurationError('Bingo number limits must be safe integers.');
  }
  if (minNumber >= maxNumber) {
    throw new InvalidConfigurationError('Bingo minNumber must be less than maxNumber.');
  }
  if (freeSpace && size % 2 === 0) {
    throw new InvalidConfigurationError('A Bingo free space requires an odd board size.');
  }

  const available = maxNumber - minNumber + 1;
  const required = size * size - (freeSpace ? 1 : 0);
  if (available < required) {
    throw new InvalidConfigurationError(
      `Bingo range contains ${available} numbers but the board requires ${required}.`,
    );
  }

  const smallestColumn = Math.floor(available / size);
  const center = Math.floor(size / 2);
  for (let column = 0; column < size; column += 1) {
    const requiredInColumn = size - (freeSpace && column === center ? 1 : 0);
    const capacity = smallestColumn + (column < available % size ? 1 : 0);
    if (capacity < requiredInColumn) {
      throw new InvalidConfigurationError(
        `Bingo column ${column + 1} has capacity ${capacity} but requires ${requiredInColumn} numbers.`,
      );
    }
  }
}

export function assertValidBingoBoard(
  board: BingoBoard,
  size: number,
  minNumber: number,
  maxNumber: number,
  freeSpace: boolean,
): void {
  if (!Array.isArray(board) || board.length !== size) {
    throw new InvalidResultError(`A Bingo board must contain exactly ${size} rows.`);
  }

  const numbers = new Set<number>();
  let freeSpaces = 0;
  for (const [rowIndex, row] of board.entries()) {
    if (!Array.isArray(row) || row.length !== size) {
      throw new InvalidResultError(`Bingo row ${rowIndex + 1} must contain exactly ${size} cells.`);
    }
    for (const value of row) {
      if (value === 'free') {
        freeSpaces += 1;
        continue;
      }
      if (!Number.isSafeInteger(value) || value < minNumber || value > maxNumber) {
        throw new InvalidResultError(
          `Bingo board numbers must be safe integers from ${minNumber} through ${maxNumber}.`,
        );
      }
      if (numbers.has(value)) {
        throw new InvalidResultError(`Bingo board contains duplicate number ${value}.`);
      }
      numbers.add(value);
    }
  }

  const center = Math.floor(size / 2);
  if (freeSpace) {
    if (freeSpaces !== 1 || board[center]?.[center] !== 'free') {
      throw new InvalidResultError('A Bingo board must contain one free space in its center.');
    }
  } else if (freeSpaces !== 0) {
    throw new InvalidResultError(
      'A Bingo board cannot contain a free space when freeSpace is false.',
    );
  }
}

export function createBingoPatternDefinitions(
  size: number,
  patterns: readonly BingoPattern[] = DEFAULT_BINGO_PATTERNS,
): readonly BingoPatternDefinition[] {
  assertPositiveInteger(size, 'Bingo size');
  if (!Array.isArray(patterns) || patterns.length === 0) {
    throw new InvalidConfigurationError('Bingo requires at least one completion pattern.');
  }

  const definitions: BingoPatternDefinition[] = [];
  const indexes = Array.from({ length: size }, (_, index) => index);
  for (const pattern of patterns) {
    if (pattern === 'row') {
      for (const row of indexes) {
        definitions.push(
          createDefinition(
            `row-${row + 1}`,
            'row',
            `Row ${row + 1}`,
            indexes.map((column) => ({ row, column })),
          ),
        );
      }
    } else if (pattern === 'column') {
      for (const column of indexes) {
        definitions.push(
          createDefinition(
            `column-${column + 1}`,
            'column',
            `Column ${column + 1}`,
            indexes.map((row) => ({ row, column })),
          ),
        );
      }
    } else if (pattern === 'diagonal') {
      definitions.push(
        createDefinition(
          'diagonal-main',
          'diagonal',
          'Main diagonal',
          indexes.map((index) => ({ row: index, column: index })),
        ),
        createDefinition(
          'diagonal-anti',
          'diagonal',
          'Opposite diagonal',
          indexes.map((index) => ({ row: index, column: size - index - 1 })),
        ),
      );
    } else if (pattern === 'four-corners') {
      definitions.push(
        createDefinition('four-corners', pattern, 'Four corners', [
          { row: 0, column: 0 },
          { row: 0, column: size - 1 },
          { row: size - 1, column: 0 },
          { row: size - 1, column: size - 1 },
        ]),
      );
    } else if (pattern === 'full-board') {
      definitions.push(
        createDefinition(
          'full-board',
          pattern,
          'Full board',
          indexes.flatMap((row) => indexes.map((column) => ({ row, column }))),
        ),
      );
    } else if (typeof pattern === 'object' && pattern !== null) {
      assertValidCustomPattern(pattern, size);
      definitions.push(
        createDefinition(pattern.id, 'custom', pattern.label ?? pattern.id, pattern.cells),
      );
    } else {
      throw new InvalidConfigurationError(`Unknown Bingo pattern "${String(pattern)}".`);
    }
  }

  const ids = new Set<string>();
  for (const definition of definitions) {
    if (ids.has(definition.id)) {
      throw new InvalidConfigurationError(`Duplicate Bingo pattern ID "${definition.id}".`);
    }
    ids.add(definition.id);
  }
  return Object.freeze(definitions);
}

export function assertValidBingoNumber(number: number, minNumber: number, maxNumber: number): void {
  if (!Number.isSafeInteger(number) || number < minNumber || number > maxNumber) {
    throw new InvalidResultError(
      `Bingo number must be a safe integer from ${minNumber} through ${maxNumber}.`,
    );
  }
}
