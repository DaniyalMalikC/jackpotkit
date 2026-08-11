import { describe, expect, it } from 'vitest';

describe('@jackpotkit/core/bingo public entrypoint', () => {
  it('exposes only the intentional Bingo runtime API', async () => {
    const bingo = await import('./index.js');

    expect(Object.keys(bingo).sort()).toEqual(
      [
        'DEFAULT_BINGO_MAX_NUMBER',
        'DEFAULT_BINGO_MIN_NUMBER',
        'DEFAULT_BINGO_PATTERNS',
        'DEFAULT_BINGO_SIZE',
        'assertValidBingoBoard',
        'assertValidBingoConfiguration',
        'assertValidBingoNumber',
        'createBingo',
        'createBingoBoard',
        'createBingoPatternDefinitions',
        'evaluateBingoPatterns',
      ].sort(),
    );
  });
});
