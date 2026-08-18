import { createDiceDefinitions, type DiceResult, type DiceSelection } from '@jackpotkit/core';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { actionButtonStyle } from '../internal/styles.js';
import { useAnimationWaiter } from '../internal/use-animation-waiter.js';
import { useReducedMotion } from '../internal/use-reduced-motion.js';
import { useResolvedTheme } from '../internal/use-resolved-theme.js';
import type { DiceProps, DiceRef } from './types.js';
import { useDiceController } from './use-dice.js';

const PIP_CELLS: Readonly<Record<number, readonly number[]>> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DiceInner<TRequest = void>(props: DiceProps<TRequest>, ref: React.ForwardedRef<DiceRef>) {
  const {
    accessibilityLabel = 'Dice',
    count,
    dice,
    duration,
    easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
    faceStyle = 'numbers',
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
  const motionElements = useRef(new Map<string, HTMLDivElement>());
  const activeAnimations = useRef<Animation[]>([]);
  const [rolling, setRolling] = useState(false);
  const [values, setValues] = useState<readonly number[]>(() => definitions.map(() => 1));
  const animationDuration = shouldReduceMotion
    ? theme.animation.reducedMotionDuration
    : (duration ?? theme.animation.diceRollDuration);
  const stopMotion = useCallback(() => {
    activeAnimations.current.forEach((animation) => animation.cancel());
    activeAnimations.current = [];
  }, []);
  const playMotion = useCallback(() => {
    stopMotion();
    if (animationDuration === 0 || shouldReduceMotion) return;

    activeAnimations.current = [...motionElements.current.values()].flatMap((element, index) => {
      if (typeof element.animate !== 'function') return [];
      const direction = index % 2 === 0 ? 1 : -1;
      return [
        element.animate(
          [
            { transform: 'translateY(0) rotate(0deg) scale(1)' },
            {
              offset: 0.34,
              transform: `translateY(-14px) rotate(${direction * 145}deg) scale(.94)`,
            },
            {
              offset: 0.78,
              transform: `translateY(3px) rotate(${direction * 330}deg) scale(1.04)`,
            },
            { transform: `translateY(0) rotate(${direction * 360}deg) scale(1)` },
          ],
          { duration: animationDuration, easing, iterations: 1 },
        ),
      ];
    });
  }, [animationDuration, easing, shouldReduceMotion, stopMotion]);
  const animate = useCallback(
    async (result: DiceResult) => {
      controller.startAnimation(result);
      setValues(result.values);
      setRolling(true);
      playMotion();
      await wait(animationDuration);
      setRolling(false);
      controller.reveal(result);
      controller.complete(result);
      return result;
    },
    [animationDuration, controller, playMotion, wait],
  );
  const roll = useCallback(
    async (selection?: DiceSelection) => animate(await controller.play(selection)),
    [animate, controller],
  );
  const reset = useCallback(() => {
    cancel('Dice was reset before its animation completed.');
    stopMotion();
    setRolling(false);
    setValues(definitions.map(() => 1));
    controller.reset();
  }, [cancel, controller, definitions, stopMotion]);
  useEffect(() => stopMotion, [stopMotion]);
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
        }}
      >
        {definitions.map((die, index) => {
          const value = values[index] ?? 1;
          return (
            <div
              key={die.id}
              ref={(element) => {
                if (element === null) motionElements.current.delete(die.id);
                else motionElements.current.set(die.id, element);
              }}
              style={{
                transformOrigin: 'center',
                willChange: rolling ? 'transform' : undefined,
              }}
            >
              {renderDie?.({ die, index, rolling, theme, value }) ?? (
                <div
                  aria-label={`${die.label ?? `Die ${index + 1}`}: ${value}`}
                  style={{
                    alignItems: 'center',
                    background: theme.colors.diceFace,
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: faceStyle === 'pips' ? dieSize * 0.2 : theme.radii.md,
                    boxShadow:
                      faceStyle === 'pips'
                        ? `inset -5px -7px 0 color-mix(in srgb, ${theme.colors.border} 42%, transparent), 0 7px 14px color-mix(in srgb, ${theme.colors.text} 16%, transparent)`
                        : undefined,
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
                  {faceStyle === 'pips' && die.sides === 6 ? (
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gridTemplateRows: 'repeat(3, 1fr)',
                        height: '68%',
                        width: '68%',
                      }}
                    >
                      {Array.from({ length: 9 }, (_, cell) => {
                        const visible = PIP_CELLS[value]?.includes(cell) === true;
                        return (
                          <span
                            data-jackpotkit-die-pip={visible ? '' : undefined}
                            key={cell}
                            style={{
                              alignSelf: 'center',
                              background: visible ? theme.colors.dicePip : 'transparent',
                              borderRadius: '50%',
                              height: '62%',
                              justifySelf: 'center',
                              width: '62%',
                            }}
                          />
                        );
                      })}
                    </span>
                  ) : (
                    value
                  )}
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
