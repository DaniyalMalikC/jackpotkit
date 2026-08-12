import { createDiceDefinitions, type DiceResult, type DiceSelection } from '@jackpotkit/core';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';

import { actionButtonStyle } from '../internal/styles.js';
import { useAnimationWaiter } from '../internal/use-animation-waiter.js';
import { useReducedMotion } from '../internal/use-reduced-motion.js';
import { useResolvedTheme } from '../internal/use-resolved-theme.js';
import type { DiceProps, DiceRef } from './types.js';
import { useDiceController } from './use-dice.js';

function DiceInner<TRequest = void>(props: DiceProps<TRequest>, ref: React.ForwardedRef<DiceRef>) {
  const {
    accessibilityLabel = 'Dice',
    count,
    dice,
    duration,
    easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
    reduceMotion,
    renderDie,
    sides,
    style,
    className,
    width = 360,
  } = props;
  const theme = useResolvedTheme(props.theme);
  const controller = useDiceController(props, false);
  const definitions = useMemo(
    () => dice ?? createDiceDefinitions(count ?? 1, sides ?? 6),
    [count, dice, sides],
  );
  const shouldReduceMotion = useReducedMotion(reduceMotion);
  const { cancel, wait } = useAnimationWaiter('Dice');
  const [rolling, setRolling] = useState(false);
  const [turns, setTurns] = useState(0);
  const [values, setValues] = useState<readonly number[]>(() => definitions.map(() => 1));
  const animationDuration = shouldReduceMotion
    ? theme.animation.reducedMotionDuration
    : (duration ?? theme.animation.diceRollDuration);
  const animate = useCallback(
    async (result: DiceResult) => {
      controller.startAnimation(result);
      setValues(result.values);
      setRolling(true);
      setTurns((value) => value + 2);
      await wait(animationDuration);
      setRolling(false);
      controller.reveal(result);
      controller.complete(result);
      return result;
    },
    [animationDuration, controller, wait],
  );
  const roll = useCallback(
    async (selection?: DiceSelection) => animate(await controller.play(selection)),
    [animate, controller],
  );
  const reset = useCallback(() => {
    cancel('Dice was reset before its animation completed.');
    setRolling(false);
    setTurns(0);
    setValues(definitions.map(() => 1));
    controller.reset();
  }, [cancel, controller, definitions]);
  useImperativeHandle(ref, () => ({ reset, roll: () => roll(), rollTo: roll }), [reset, roll]);
  const disabled = props.disabled === true || rolling || controller.status === 'requesting-result';
  const dieSize = Math.max(52, Math.min(96, (width - theme.spacing.md * 2) / definitions.length));
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
          display: 'flex',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
          justifyContent: 'center',
          perspective: 800,
        }}
      >
        {definitions.map((die, index) => {
          const value = values[index] ?? 1;
          return (
            <div
              key={die.id}
              style={{
                transform: `rotateX(${turns * 360}deg) rotateY(${turns * 270}deg)`,
                transition: `transform ${animationDuration}ms ${easing}`,
              }}
            >
              {renderDie?.({ die, index, rolling, theme, value }) ?? (
                <div
                  aria-label={`${die.label ?? `Die ${index + 1}`}: ${value}`}
                  style={{
                    alignItems: 'center',
                    background: theme.colors.diceFace,
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: theme.radii.md,
                    color: theme.colors.dicePip,
                    display: 'flex',
                    fontFamily: theme.typography.fontFamily,
                    fontSize: theme.typography.titleSize * 1.5,
                    fontWeight: 900,
                    height: dieSize,
                    justifyContent: 'center',
                    width: dieSize,
                  }}
                >
                  {value}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        aria-busy={disabled}
        disabled={disabled}
        onClick={() => void roll().catch(() => undefined)}
        style={actionButtonStyle(theme, disabled)}
        type="button"
      >
        {disabled ? 'Rolling…' : 'Roll dice'}
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
        }}
      >
        {controller.status === 'completed' ? `Total: ${controller.result?.total ?? 0}` : ''}
      </div>
    </div>
  );
}
export const Dice = forwardRef(DiceInner);
