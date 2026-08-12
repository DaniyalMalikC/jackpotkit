import type { LuckyBoxResult, LuckyBoxSelection } from '@jackpotkit/core';
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { actionButtonStyle } from '../internal/styles.js';
import { useAnimationWaiter } from '../internal/use-animation-waiter.js';
import { useReducedMotion } from '../internal/use-reduced-motion.js';
import { useResolvedTheme } from '../internal/use-resolved-theme.js';
import type { LuckyBoxProps, LuckyBoxRef } from './types.js';
import { useLuckyBoxController } from './use-lucky-box.js';

function LuckyBoxInner<TReward = unknown, TRequest = void>(
  props: LuckyBoxProps<TReward, TRequest>,
  ref: React.ForwardedRef<LuckyBoxRef<TReward>>,
) {
  const {
    accessibilityLabel = 'Lucky Box',
    boxes,
    columns = 3,
    duration,
    easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
    reduceMotion,
    renderBox,
    style,
    className,
    width = 420,
  } = props;
  if (!Number.isInteger(columns) || columns < 1)
    throw new RangeError('Lucky Box columns must be a positive integer.');
  const theme = useResolvedTheme(props.theme);
  const controller = useLuckyBoxController(props, false);
  const shouldReduceMotion = useReducedMotion(reduceMotion);
  const { cancel, wait } = useAnimationWaiter('Lucky Box');
  const [revealing, setRevealing] = useState(false);
  const [displayResult, setDisplayResult] = useState<LuckyBoxResult<TReward>>();
  const animationDuration = shouldReduceMotion
    ? theme.animation.reducedMotionDuration
    : (duration ?? theme.animation.luckyBoxRevealDuration);
  const animate = useCallback(
    async (result: LuckyBoxResult<TReward>) => {
      controller.startAnimation(result);
      setDisplayResult(result);
      setRevealing(true);
      await wait(animationDuration);
      setRevealing(false);
      controller.reveal(result);
      controller.complete(result);
      return result;
    },
    [animationDuration, controller, wait],
  );
  const reveal = useCallback(
    async (selection?: LuckyBoxSelection) => animate(await controller.play(selection)),
    [animate, controller],
  );
  const pick = useCallback(
    (boxId: string) => {
      controller.select(boxId);
      return reveal();
    },
    [controller, reveal],
  );
  const reset = useCallback(() => {
    cancel('Lucky Box was reset before its animation completed.');
    setDisplayResult(undefined);
    setRevealing(false);
    controller.reset();
  }, [cancel, controller]);
  useImperativeHandle(
    ref,
    () => ({ pick, reset, reveal: () => reveal(), revealTo: reveal, select: controller.select }),
    [controller.select, pick, reset, reveal],
  );
  const disabled =
    props.disabled === true ||
    revealing ||
    controller.status === 'requesting-result' ||
    displayResult !== undefined;
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
          gap: theme.spacing.sm,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          width: '100%',
        }}
      >
        {boxes.map((box) => {
          const selected = controller.selectedBoxId === box.id;
          const winning = displayResult?.winningBox.id === box.id;
          const buttonDisabled = disabled || box.disabled === true;
          return (
            <button
              aria-pressed={selected}
              disabled={buttonDisabled}
              key={box.id}
              onClick={() => controller.select(box.id)}
              style={{
                background: selected ? theme.colors.luckyBoxSelected : theme.colors.luckyBox,
                border: `${winning ? 3 : 2}px solid ${winning ? theme.colors.primary : theme.colors.border}`,
                borderRadius: theme.radii.md,
                color: selected ? theme.colors.dicePip : theme.colors.text,
                cursor: buttonDisabled ? 'not-allowed' : 'pointer',
                fontFamily: theme.typography.fontFamily,
                fontWeight: 900,
                minHeight: 88,
                opacity: buttonDisabled && !winning ? 0.7 : 1,
                padding: theme.spacing.sm,
                transform: winning && revealing ? 'scale(1.08) rotate(3deg)' : 'none',
                transition: `transform ${animationDuration}ms ${easing}`,
              }}
            >
              {renderBox?.({
                box,
                revealed: displayResult !== undefined,
                selected,
                theme,
                winning,
              }) ?? (
                <>
                  {winning ? '★ ' : ''}
                  {box.label ?? box.id}
                  {box.disabled === true ? ' · unavailable' : ''}
                </>
              )}
            </button>
          );
        })}
      </div>
      <button
        aria-busy={revealing}
        disabled={disabled || controller.selectedBoxId === undefined}
        onClick={() => void reveal().catch(() => undefined)}
        style={actionButtonStyle(theme, disabled || controller.selectedBoxId === undefined)}
        type="button"
      >
        {revealing ? 'Revealing…' : 'Reveal selection'}
      </button>
      <div
        aria-live="polite"
        role="status"
        style={{
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.titleSize,
          fontWeight: 800,
          minHeight: 28,
          textAlign: 'center',
        }}
      >
        {controller.status === 'completed' && displayResult !== undefined
          ? displayResult.won
            ? 'You found the winning box!'
            : `Winning box: ${displayResult.winningBox.label ?? displayResult.winningBox.id}`
          : ''}
      </div>
    </div>
  );
}
export const LuckyBox = forwardRef(LuckyBoxInner) as <TReward = unknown, TRequest = void>(
  props: LuckyBoxProps<TReward, TRequest> & React.RefAttributes<LuckyBoxRef<TReward>>,
) => React.ReactElement;
