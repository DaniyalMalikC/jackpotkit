import type { SlotPayline, SlotSymbol, SlotWinningPayline } from './types.js';

export function evaluateSlotPaylines<TValue>(
  reels: readonly (readonly SlotSymbol<TValue>[])[],
  paylines: readonly SlotPayline[],
): readonly SlotWinningPayline<TValue>[] {
  const winners: SlotWinningPayline<TValue>[] = [];

  paylines.forEach((rows, index) => {
    const symbols = rows.map((row, reelIndex) => reels[reelIndex]?.[row]);
    const first = symbols[0];
    if (first === undefined || symbols.some((symbol) => symbol?.id !== first.id)) return;

    winners.push(
      Object.freeze({
        index,
        rows,
        symbolId: first.id,
        symbols: Object.freeze(symbols as SlotSymbol<TValue>[]),
      }),
    );
  });

  return Object.freeze(winners);
}
