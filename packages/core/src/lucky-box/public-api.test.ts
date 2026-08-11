import { describe, expect, it } from 'vitest';

describe('@jackpotkit/core/lucky-box public entrypoint', () => {
  it('exposes only the intentional Lucky Box runtime API', async () => {
    const luckyBox = await import('./index.js');
    expect(Object.keys(luckyBox).sort()).toEqual(
      [
        'assertSelectableLuckyBox',
        'assertValidLuckyBoxes',
        'assertValidLuckyBoxSelection',
        'createLuckyBox',
      ].sort(),
    );
  });
});
