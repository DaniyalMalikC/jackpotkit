import { describe, expect, it } from 'vitest';

describe('web-independent core package', () => {
  it('runs deterministic primitives in Node without DOM globals', async () => {
    const { SeededRandomSource, createGameEvent, nextRandomValue } =
      await import('@jackpotkit/core');
    const first = new SeededRandomSource('web-smoke');
    const second = new SeededRandomSource('web-smoke');

    expect(nextRandomValue(first)).toBe(nextRandomValue(second));
    expect(createGameEvent('ready', null, { timestamp: 0 })).toEqual({
      payload: null,
      timestamp: 0,
      type: 'ready',
    });
  });
});
