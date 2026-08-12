import { forwardRef, useImperativeHandle, useMemo } from 'react';

import { actionButtonStyle } from '../internal/styles.js';
import { useReducedMotion } from '../internal/use-reduced-motion.js';
import { useResolvedTheme } from '../internal/use-resolved-theme.js';
import type { BingoCellRenderInfo, BingoProps, BingoRef } from './types.js';
import { useBingo } from './use-bingo.js';

const CLASSIC_HEADERS = Object.freeze(['B', 'I', 'N', 'G', 'O']);
function BingoInner(props: BingoProps, ref: React.ForwardedRef<BingoRef>) {
  const {
    accessibilityLabel = 'Bingo board',
    cellGap = 6,
    reduceMotion,
    renderCell,
    showCallButton = true,
    style,
    className,
    width = 480,
  } = props;
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(cellGap) || cellGap < 0)
    throw new RangeError('Bingo width must be positive and cellGap cannot be negative.');
  const theme = useResolvedTheme(props.theme);
  const controller = useBingo(props);
  const shouldReduceMotion = useReducedMotion(reduceMotion);
  const duration = shouldReduceMotion
    ? theme.animation.reducedMotionDuration
    : theme.animation.bingoMarkDuration;
  const called = useMemo(
    () => new Set(controller.state.calledNumbers),
    [controller.state.calledNumbers],
  );
  const marked = useMemo(
    () => new Set(controller.state.markedNumbers),
    [controller.state.markedNumbers],
  );
  const matched = useMemo(() => {
    const cells = new Set<string>();
    controller.state.matches.forEach((match) =>
      match.cells.forEach(({ row, column }) => cells.add(`${row}:${column}`)),
    );
    return cells;
  }, [controller.state.matches]);
  const headers =
    controller.board.length === 5
      ? CLASSIC_HEADERS
      : controller.board.map((_, index) => String(index + 1));
  const lastCalled = controller.state.calledNumbers.at(-1);
  const min = props.minNumber ?? 1;
  const max = props.maxNumber ?? 75;
  const allCalled = controller.state.calledNumbers.length >= max - min + 1;
  const isDisabled = controller.status === 'disabled';
  useImperativeHandle(
    ref,
    () => ({
      call: controller.call,
      check: controller.check,
      draw: controller.draw,
      mark: controller.mark,
      reset: controller.reset,
      unmark: controller.unmark,
    }),
    [controller],
  );
  return (
    <div
      aria-label={accessibilityLabel}
      className={className}
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.md,
        maxWidth: '100%',
        width,
        ...style,
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: cellGap,
          gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
          width: '100%',
        }}
      >
        {headers.map((header) => (
          <div
            key={header}
            style={{
              color: theme.colors.bingoMarked,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.titleSize,
              fontWeight: 900,
              textAlign: 'center',
            }}
          >
            {header}
          </div>
        ))}
        {controller.board.flatMap((row, rowIndex) =>
          row.map((value, columnIndex) => {
            const free = value === 'free';
            const cellCalled = free || called.has(value as number);
            const cellMarked = free || marked.has(value as number);
            const info: BingoCellRenderInfo = {
              value,
              rowIndex,
              columnIndex,
              called: cellCalled,
              marked: cellMarked,
              matched: matched.has(`${rowIndex}:${columnIndex}`),
              disabled: free || isDisabled || !cellCalled,
              theme,
            };
            const label = free
              ? 'Free space, marked'
              : `Number ${value}${cellCalled ? ', called' : ', not called'}${cellMarked ? ', marked' : ''}`;
            return (
              <button
                aria-label={label}
                aria-pressed={cellMarked}
                disabled={info.disabled}
                key={`${rowIndex}:${columnIndex}`}
                onClick={() => {
                  if (typeof value === 'number') controller.toggleMark(value);
                }}
                style={{
                  aspectRatio: '1',
                  background: info.matched
                    ? theme.colors.bingoFree
                    : info.marked
                      ? theme.colors.bingoMarked
                      : theme.colors.surface,
                  border: `2px solid ${info.called ? theme.colors.bingoMarked : theme.colors.border}`,
                  borderRadius: theme.radii.sm,
                  color: info.marked && !info.matched ? theme.colors.onPrimary : theme.colors.text,
                  cursor: info.disabled ? 'default' : 'pointer',
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: 900,
                  minWidth: 0,
                  padding: theme.spacing.xs,
                  transform: info.marked ? 'scale(1)' : 'scale(.96)',
                  transition: `transform ${duration}ms ease, background ${duration}ms ease`,
                }}
              >
                {renderCell?.(info) ?? (free ? 'FREE' : value)}
              </button>
            );
          }),
        )}
      </div>
      {showCallButton ? (
        <button
          disabled={isDisabled || controller.state.completed || allCalled}
          onClick={() => controller.draw()}
          style={actionButtonStyle(theme, isDisabled || controller.state.completed || allCalled)}
          type="button"
        >
          {allCalled
            ? 'All numbers called'
            : lastCalled === undefined
              ? 'Call next number'
              : `Last call: ${lastCalled}`}
        </button>
      ) : null}
      <div
        aria-live="polite"
        role="status"
        style={{
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.titleSize,
          fontWeight: 900,
          minHeight: 28,
          textAlign: 'center',
        }}
      >
        {controller.result === undefined
          ? ''
          : `Bingo! Completed ${controller.result.matches.map((match) => match.label).join(', ')}.`}
      </div>
    </div>
  );
}
export const Bingo = forwardRef(BingoInner);
