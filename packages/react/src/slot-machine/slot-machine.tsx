import type { SlotMachineResult, SlotMachineSelection, SlotSymbol } from '@jackpotkit/core';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';

import { actionButtonStyle } from '../internal/styles.js';
import { useAnimationWaiter } from '../internal/use-animation-waiter.js';
import { useReducedMotion } from '../internal/use-reduced-motion.js';
import { useResolvedTheme } from '../internal/use-resolved-theme.js';
import type { SlotMachineProps, SlotMachineRef } from './types.js';
import { useSlotMachineController } from './use-slot-machine.js';

function SlotMachineInner<TValue = unknown, TEvaluation = unknown, TRequest = void>(
  props: SlotMachineProps<TValue, TEvaluation, TRequest>,
  ref: React.ForwardedRef<SlotMachineRef<TValue, TEvaluation>>,
) {
  const {
    accessibilityLabel = 'Slot Machine',
    duration,
    easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
    reduceMotion,
    reelDelay,
    renderSymbol,
    rowCount = 3,
    style,
    className,
    symbolHeight = 64,
    width = 420,
  } = props;
  const theme = useResolvedTheme(props.theme);
  const controller = useSlotMachineController(props, false);
  const shouldReduceMotion = useReducedMotion(reduceMotion);
  const { cancel, wait } = useAnimationWaiter('Slot Machine');
  const [spinning, setSpinning] = useState(false);
  const [turns, setTurns] = useState(0);
  const preview = useMemo(
    () =>
      Array.from({ length: props.reelCount }, (_, reelIndex) =>
        Array.from(
          { length: rowCount },
          (_, rowIndex) =>
            props.symbols[(reelIndex + rowIndex) % props.symbols.length] as SlotSymbol<TValue>,
        ),
      ),
    [props.reelCount, props.symbols, rowCount],
  );
  const reels = controller.result?.reels ?? preview;
  const baseDuration = shouldReduceMotion
    ? theme.animation.reducedMotionDuration
    : (duration ?? theme.animation.slotDuration);
  const delay = shouldReduceMotion ? 0 : (reelDelay ?? theme.animation.slotReelDelay);
  const animate = useCallback(
    async (result: SlotMachineResult<TValue, TEvaluation>) => {
      controller.startAnimation(result);
      setSpinning(true);
      setTurns((value) => value + 1);
      await wait(baseDuration + delay * Math.max(0, props.reelCount - 1));
      result.reels.forEach((_, index) => controller.reelStop(index, result));
      setSpinning(false);
      controller.reveal(result);
      controller.complete(result);
      return result;
    },
    [baseDuration, controller, delay, props.reelCount, wait],
  );
  const spin = useCallback(
    async (selection?: SlotMachineSelection) => animate(await controller.play(selection)),
    [animate, controller],
  );
  const reset = useCallback(() => {
    cancel('Slot Machine was reset before its animation completed.');
    setSpinning(false);
    setTurns(0);
    controller.reset();
  }, [cancel, controller]);
  useImperativeHandle(ref, () => ({ reset, spin: () => spin(), spinTo: spin }), [reset, spin]);
  const winningCells = useMemo(() => {
    const cells = new Set<string>();
    controller.result?.winningPaylines.forEach((payline) =>
      payline.rows.forEach((rowIndex, reelIndex) => cells.add(`${reelIndex}:${rowIndex}`)),
    );
    return cells;
  }, [controller.result]);
  const disabled = props.disabled === true || spinning || controller.status === 'requesting-result';
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
          background: theme.colors.slotBackground,
          border: `3px solid ${theme.colors.slotAccent}`,
          borderRadius: theme.radii.lg,
          display: 'grid',
          gap: theme.spacing.sm,
          gridTemplateColumns: `repeat(${props.reelCount}, minmax(0, 1fr))`,
          overflow: 'hidden',
          padding: theme.spacing.md,
          width: '100%',
        }}
      >
        {reels.map((reel, reelIndex) => (
          <div
            key={reelIndex}
            style={{
              display: 'grid',
              gap: theme.spacing.xs,
              transform: `translateY(${turns % 2 === 0 ? 0 : -8}px) rotateX(${turns * 360}deg)`,
              transition: `transform ${baseDuration}ms ${easing} ${reelIndex * delay}ms`,
            }}
          >
            {reel.map((symbol, rowIndex) => {
              const winning = winningCells.has(`${reelIndex}:${rowIndex}`);
              return (
                <div
                  key={`${symbol.id}:${rowIndex}`}
                  style={{
                    alignItems: 'center',
                    background: winning ? theme.colors.slotAccent : theme.colors.surface,
                    borderRadius: theme.radii.sm,
                    color: winning ? theme.colors.onPrimary : theme.colors.text,
                    display: 'flex',
                    fontFamily: theme.typography.fontFamily,
                    fontSize: theme.typography.titleSize,
                    fontWeight: 900,
                    height: symbolHeight,
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {renderSymbol?.({ reelIndex, rowIndex, symbol, theme, winning }) ??
                    symbol.label ??
                    symbol.id}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <button
        aria-busy={disabled}
        disabled={disabled}
        onClick={() => void spin().catch(() => undefined)}
        style={actionButtonStyle(theme, disabled)}
        type="button"
      >
        {disabled ? 'Spinning…' : 'Spin reels'}
      </button>
      <div
        aria-live="polite"
        role="status"
        style={{
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily,
          fontWeight: 800,
          minHeight: 24,
        }}
      >
        {controller.status === 'completed'
          ? `${controller.result?.winningPaylines.length ?? 0} winning payline${controller.result?.winningPaylines.length === 1 ? '' : 's'}`
          : ''}
      </div>
    </div>
  );
}
export const SlotMachine = forwardRef(SlotMachineInner) as <
  TValue = unknown,
  TEvaluation = unknown,
  TRequest = void,
>(
  props: SlotMachineProps<TValue, TEvaluation, TRequest> &
    React.RefAttributes<SlotMachineRef<TValue, TEvaluation>>,
) => React.ReactElement;
