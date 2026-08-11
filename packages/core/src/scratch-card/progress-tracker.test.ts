import { describe, expect, it } from 'vitest';

import { InvalidConfigurationError } from '../errors/index.js';
import { createScratchProgressTracker } from './progress-tracker.js';

describe('Scratch Card progress tracker', () => {
  it('tracks point and line coverage monotonically', () => {
    const tracker = createScratchProgressTracker({
      brushRadius: 10,
      cellSize: 5,
      height: 50,
      width: 100,
    });

    const pointProgress = tracker.scratchPoint({ x: 10, y: 10 });
    const repeatedProgress = tracker.scratchPoint({ x: 10, y: 10 });
    const lineProgress = tracker.scratchLine({ x: 10, y: 25 }, { x: 90, y: 25 });

    expect(pointProgress).toBeGreaterThan(0);
    expect(repeatedProgress).toBe(pointProgress);
    expect(lineProgress).toBeGreaterThan(pointProgress);
    expect(tracker.progress).toBe(lineProgress);
  });

  it('resets the occupied grid', () => {
    const tracker = createScratchProgressTracker({ brushRadius: 8, height: 40, width: 40 });
    tracker.scratchLine({ x: 0, y: 20 }, { x: 40, y: 20 });

    expect(tracker.progress).toBeGreaterThan(0);
    tracker.reset();
    expect(tracker.progress).toBe(0);
  });

  it('rejects invalid geometry and points', () => {
    expect(() => createScratchProgressTracker({ brushRadius: 0, height: 40, width: 40 })).toThrow(
      InvalidConfigurationError,
    );

    const tracker = createScratchProgressTracker({ brushRadius: 8, height: 40, width: 40 });
    expect(() => tracker.scratchPoint({ x: Number.NaN, y: 2 })).toThrow(InvalidConfigurationError);
  });
});
