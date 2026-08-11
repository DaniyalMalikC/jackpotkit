import { assertValidScratchCardConfiguration, assertValidScratchPoint } from './validation.js';
import type {
  ScratchPoint,
  ScratchProgressTracker,
  ScratchProgressTrackerOptions,
} from './types.js';

function distanceToLineSquared(point: ScratchPoint, from: ScratchPoint, to: ScratchPoint): number {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (lengthSquared === 0) {
    return (point.x - from.x) ** 2 + (point.y - from.y) ** 2;
  }

  const projection = Math.max(
    0,
    Math.min(1, ((point.x - from.x) * deltaX + (point.y - from.y) * deltaY) / lengthSquared),
  );
  const closestX = from.x + projection * deltaX;
  const closestY = from.y + projection * deltaY;
  return (point.x - closestX) ** 2 + (point.y - closestY) ** 2;
}

export function createScratchProgressTracker({
  width,
  height,
  brushRadius,
  cellSize = Math.max(2, Math.min(brushRadius / 2, 12)),
}: ScratchProgressTrackerOptions): ScratchProgressTracker {
  assertValidScratchCardConfiguration({ width, height, brushRadius, cellSize });

  const columns = Math.max(1, Math.ceil(width / cellSize));
  const rows = Math.max(1, Math.ceil(height / cellSize));
  const totalCells = columns * rows;
  const scratchedCells = new Set<number>();
  const brushRadiusSquared = brushRadius ** 2;

  function scratchLine(from: ScratchPoint, to: ScratchPoint): number {
    assertValidScratchPoint(from, 'from');
    assertValidScratchPoint(to, 'to');

    for (let row = 0; row < rows; row += 1) {
      const y = Math.min(height, (row + 0.5) * cellSize);

      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column;
        if (scratchedCells.has(index)) continue;

        const x = Math.min(width, (column + 0.5) * cellSize);
        if (distanceToLineSquared({ x, y }, from, to) <= brushRadiusSquared) {
          scratchedCells.add(index);
        }
      }
    }

    return scratchedCells.size / totalCells;
  }

  return {
    get progress() {
      return scratchedCells.size / totalCells;
    },
    scratchPoint(point) {
      return scratchLine(point, point);
    },
    scratchLine,
    reset() {
      scratchedCells.clear();
    },
  };
}
