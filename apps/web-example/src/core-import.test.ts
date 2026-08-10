import { describe, expect, it } from 'vitest';

describe('web-independent core package', () => {
  it('loads in a Node test environment without DOM globals', async () => {
    const core = await import('@jackpotkit/core');

    expect(Object.keys(core)).toEqual([]);
  });
});
