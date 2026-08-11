import { InvalidConfigurationError } from '@jackpotkit/core';

export function assertBingoComponentConfiguration(width?: number, cellGap = 6): void {
  if (width !== undefined && (!Number.isFinite(width) || width <= 0)) {
    throw new InvalidConfigurationError('Bingo width must be a positive finite number.');
  }
  if (!Number.isFinite(cellGap) || cellGap < 0) {
    throw new InvalidConfigurationError('Bingo cellGap must be a non-negative finite number.');
  }
}
