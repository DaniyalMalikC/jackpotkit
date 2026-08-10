import { describe, expect, it } from 'vitest';

describe('@jackpotkit/core Phase 0 entrypoint', () => {
  it('imports without browser or native globals and exposes no runtime API', async () => {
    const core = await import('./index.js');

    expect(Object.keys(core)).toEqual([]);
  });
});
