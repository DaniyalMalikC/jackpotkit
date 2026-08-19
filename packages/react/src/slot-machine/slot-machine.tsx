import type { SlotMachineResult, SlotMachineSelection, SlotSymbol } from '@jackpotkit/core';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';

import { useAnimationWaiter } from '../internal/use-animation-waiter.js';
import { useReducedMotion } from '../internal/use-reduced-motion.js';
import { useResolvedTheme } from '../internal/use-resolved-theme.js';
import { SlotReel } from './slot-reel.js';
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
  const [animationOperation, setAnimationOperation] = useState(0);
  const [displayResult, setDisplayResult] = useState<SlotMachineResult<TValue, TEvaluation>>();
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
  const reels = displayResult?.reels ?? preview;
  const baseDuration = shouldReduceMotion
    ? theme.animation.reducedMotionDuration
    : (duration ?? theme.animation.slotDuration);
  const delay = shouldReduceMotion ? 0 : (reelDelay ?? theme.animation.slotReelDelay);
  const animate = useCallback(
    async (result: SlotMachineResult<TValue, TEvaluation>) => {
      controller.startAnimation(result);
      setDisplayResult(result);
      setSpinning(true);
      setAnimationOperation((value) => value + 1);
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
    setAnimationOperation(0);
    setDisplayResult(undefined);
    controller.reset();
  }, [cancel, controller]);
  useImperativeHandle(ref, () => ({ reset, spin: () => spin(), spinTo: spin }), [reset, spin]);
  const winningCells = useMemo(() => {
    const cells = new Set<string>();
    if (controller.status !== 'completed') return cells;
    displayResult?.winningPaylines.forEach((payline) =>
      payline.rows.forEach((rowIndex, reelIndex) => cells.add(`${reelIndex}:${rowIndex}`)),
    );
    return cells;
  }, [controller.status, displayResult]);
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
        data-jackpotkit-slot-cabinet=""
        style={{
          background: `linear-gradient(145deg, ${theme.colors.slotBackground}, ${theme.colors.text})`,
          border: `4px solid ${theme.colors.slotAccent}`,
          borderRadius: theme.radii.lg,
          boxShadow:
            'inset 0 1px 0 rgb(255 255 255 / 20%), inset 0 -10px 24px rgb(0 0 0 / 22%), 0 18px 32px rgb(37 25 77 / 24%)',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
          overflow: 'hidden',
          padding: theme.spacing.md,
          width: '100%',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            alignItems: 'center',
            display: 'grid',
            gap: theme.spacing.sm,
            gridTemplateColumns: 'auto 1fr auto',
            minHeight: 38,
          }}
        >
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 1, 2].map((light) => (
              <span
                key={light}
                style={{
                  background: light === 1 ? theme.colors.slotAccent : theme.colors.scratchAccent,
                  border: '2px solid rgb(255 255 255 / 70%)',
                  borderRadius: '50%',
                  boxShadow: `0 0 10px ${light === 1 ? theme.colors.slotAccent : theme.colors.scratchAccent}`,
                  height: 10,
                  width: 10,
                }}
              />
            ))}
          </div>
          <strong
            style={{
              color: theme.colors.onPrimary,
              fontFamily: theme.typography.fontFamily,
              fontSize: Math.max(14, theme.typography.labelSize),
              letterSpacing: '0.18em',
              textAlign: 'center',
            }}
          >
            LUCKY REELS
          </strong>
          <span
            style={{
              background: spinning ? theme.colors.slotAccent : 'rgb(255 255 255 / 14%)',
              borderRadius: theme.radii.full,
              color: theme.colors.onPrimary,
              fontFamily: theme.typography.fontFamily,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.08em',
              padding: '6px 8px',
            }}
          >
            {spinning ? 'SPINNING' : 'READY'}
          </span>
        </div>

        <div
          style={{
            background: 'rgb(0 0 0 / 34%)',
            border: `2px solid ${theme.colors.slotAccent}`,
            borderRadius: theme.radii.md,
            boxShadow: 'inset 0 10px 20px rgb(0 0 0 / 28%), 0 1px 0 rgb(255 255 255 / 18%)',
            overflow: 'hidden',
            padding: theme.spacing.sm,
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: theme.spacing.sm,
              gridTemplateColumns: `repeat(${props.reelCount}, minmax(0, 1fr))`,
            }}
          >
            {reels.map((destination, reelIndex) => (
              <SlotReel
                active={spinning}
                destination={destination}
                duration={baseDuration}
                easing={easing}
                key={reelIndex}
                operation={animationOperation}
                reelDelay={delay}
                reelIndex={reelIndex}
                {...(renderSymbol === undefined ? {} : { renderSymbol })}
                rowCount={rowCount}
                symbolHeight={symbolHeight}
                symbols={props.symbols}
                theme={theme}
                winningCells={winningCells}
              />
            ))}
          </div>
          <div
            aria-hidden="true"
            style={{
              borderTop: `2px solid ${theme.colors.slotAccent}`,
              boxShadow: `0 0 8px ${theme.colors.slotAccent}`,
              left: 0,
              opacity: 0.46,
              pointerEvents: 'none',
              position: 'absolute',
              right: 0,
              top: '50%',
            }}
          />
        </div>

        <div
          aria-hidden="true"
          style={{
            alignItems: 'center',
            color: theme.colors.onPrimary,
            display: 'flex',
            fontFamily: theme.typography.fontFamily,
            fontSize: 10,
            fontWeight: 900,
            justifyContent: 'space-between',
            letterSpacing: '0.12em',
            opacity: 0.72,
            padding: `0 ${theme.spacing.xs}px`,
          }}
        >
          <span>{props.reelCount} REELS</span>
          <span>● ● ●</span>
          <span>{rowCount} ROWS</span>
        </div>
      </div>
      <button
        aria-label="Spin reels"
        aria-busy={disabled}
        disabled={disabled}
        onClick={() => void spin().catch(() => undefined)}
        style={{
          alignItems: 'center',
          background: `linear-gradient(180deg, ${theme.colors.primary}, ${theme.colors.slotAccent})`,
          border: '2px solid rgb(255 255 255 / 45%)',
          borderRadius: theme.radii.full,
          boxShadow: '0 8px 18px rgb(37 25 77 / 24%), inset 0 1px 0 rgb(255 255 255 / 30%)',
          color: theme.colors.onPrimary,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.labelSize,
          fontWeight: 900,
          gap: theme.spacing.sm,
          justifyContent: 'center',
          minWidth: 190,
          opacity: disabled ? 0.62 : 1,
          padding: `${theme.spacing.sm + 3}px ${theme.spacing.lg}px`,
        }}
        type="button"
      >
        <span aria-hidden="true" style={{ fontSize: 18 }}>
          ↻
        </span>
        {disabled ? 'SPINNING…' : 'PULL TO SPIN'}
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
