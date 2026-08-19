import type { SlotSymbol } from '@jackpotkit/core';
import type { JackpotTheme } from '@jackpotkit/theme';
import { useEffect, useMemo, useRef } from 'react';

import type { WebEasing } from '../internal/types.js';
import type { SlotSymbolRenderInfo } from './types.js';

interface SlotReelProps<TValue> {
  readonly active: boolean;
  readonly destination: readonly SlotSymbol<TValue>[];
  readonly duration: number;
  readonly easing: WebEasing;
  readonly operation: number;
  readonly reelDelay: number;
  readonly reelIndex: number;
  readonly renderSymbol?: (info: SlotSymbolRenderInfo<TValue>) => React.ReactNode;
  readonly rowCount: number;
  readonly symbolHeight: number;
  readonly symbols: readonly SlotSymbol<TValue>[];
  readonly theme: JackpotTheme;
  readonly winningCells: ReadonlySet<string>;
}

export function SlotReel<TValue>({
  active,
  destination,
  duration,
  easing,
  operation,
  reelDelay,
  reelIndex,
  renderSymbol,
  rowCount,
  symbolHeight,
  symbols,
  theme,
  winningCells,
}: SlotReelProps<TValue>) {
  const stripRef = useRef<HTMLDivElement>(null);
  const filler = useMemo(
    () =>
      Array.from(
        { length: Math.max(12, symbols.length * 3) + reelIndex * 3 },
        (_, index) => symbols[(index + reelIndex) % symbols.length] as SlotSymbol<TValue>,
      ),
    [reelIndex, symbols],
  );
  const strip = [...filler, ...destination];
  const target = -filler.length * symbolHeight;

  useEffect(() => {
    const element = stripRef.current;
    if (!active || operation === 0 || element === null || typeof element.animate !== 'function') {
      return;
    }

    const animation = element.animate(
      [{ transform: 'translate3d(0, 0, 0)' }, { transform: `translate3d(0, ${target}px, 0)` }],
      {
        delay: reelIndex * reelDelay,
        duration,
        easing: easing ?? 'ease-out',
        fill: 'backwards',
      },
    );
    return () => animation.cancel();
  }, [active, duration, easing, operation, reelDelay, reelIndex, target]);

  return (
    <div
      aria-hidden="true"
      data-jackpotkit-slot-reel=""
      style={{
        background: theme.colors.surface,
        border: `2px solid ${theme.colors.slotAccent}`,
        borderRadius: theme.radii.md,
        boxShadow: 'inset 0 12px 18px rgb(23 20 43 / 12%), inset 0 -12px 18px rgb(23 20 43 / 12%)',
        height: rowCount * symbolHeight,
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        data-jackpotkit-slot-strip=""
        ref={stripRef}
        style={{
          transform: `translate3d(0, ${target}px, 0)`,
          willChange: active ? 'transform' : undefined,
        }}
      >
        {strip.map((symbol, stripIndex) => {
          const rowIndex = stripIndex - filler.length;
          const winning = rowIndex >= 0 && winningCells.has(`${reelIndex}:${rowIndex}`);
          return (
            <div
              key={`${operation}:${stripIndex}:${symbol.id}`}
              style={{
                alignItems: 'center',
                background: winning
                  ? `linear-gradient(145deg, ${theme.colors.slotAccent}, ${theme.colors.primary})`
                  : `linear-gradient(180deg, ${theme.colors.surface}, ${theme.colors.background})`,
                borderBottom: `1px solid ${theme.colors.border}`,
                color: winning ? theme.colors.onPrimary : theme.colors.text,
                display: 'flex',
                fontFamily: theme.typography.fontFamily,
                fontSize: Math.min(34, symbolHeight * 0.5),
                fontWeight: 900,
                height: symbolHeight,
                justifyContent: 'center',
                lineHeight: 1,
                overflow: 'hidden',
                padding: `0 ${theme.spacing.xs}px`,
                textAlign: 'center',
                textShadow: winning ? '0 2px 6px rgb(23 20 43 / 28%)' : undefined,
              }}
            >
              {renderSymbol?.({
                reelIndex,
                rowIndex: Math.max(0, rowIndex),
                symbol,
                theme,
                winning,
              }) ??
                symbol.label ??
                symbol.id}
            </div>
          );
        })}
      </div>
    </div>
  );
}
