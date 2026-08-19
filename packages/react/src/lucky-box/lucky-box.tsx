import type { LuckyBoxResult, LuckyBoxSelection } from '@jackpotkit/core';
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { actionButtonStyle } from '../internal/styles.js';
import { useAnimationWaiter } from '../internal/use-animation-waiter.js';
import { useReducedMotion } from '../internal/use-reduced-motion.js';
import { useResolvedTheme } from '../internal/use-resolved-theme.js';
import type { LuckyBoxProps, LuckyBoxRef } from './types.js';
import { useLuckyBoxController } from './use-lucky-box.js';

interface GiftBoxFaceProps {
  readonly accentColor: string;
  readonly boxColor: string;
  readonly disabled: boolean;
  readonly label: string;
  readonly opening: boolean;
  readonly selected: boolean;
  readonly winning: boolean;
}

function GiftBoxFace({
  accentColor,
  boxColor,
  disabled,
  label,
  opening,
  selected,
  winning,
}: GiftBoxFaceProps) {
  return (
    <span
      data-jackpotkit-lucky-gift=""
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 124,
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        width: '100%',
      }}
    >
      <span
        aria-hidden="true"
        data-jackpotkit-lucky-gift-reward=""
        style={{
          color: accentColor,
          fontSize: 30,
          left: '50%',
          opacity: winning ? 1 : 0,
          position: 'absolute',
          top: 30,
          transform: winning
            ? 'translate(-50%, -42px) scale(1.08) rotate(8deg)'
            : 'translate(-50%, 8px) scale(0.45)',
          transition: 'opacity 180ms ease, transform 360ms cubic-bezier(0.2, 1.4, 0.4, 1)',
          zIndex: 1,
        }}
      >
        ★
      </span>
      <span
        aria-hidden="true"
        style={{
          filter: winning ? `drop-shadow(0 0 12px ${accentColor})` : 'none',
          height: 84,
          marginTop: 9,
          position: 'relative',
          transform: opening ? 'scale(1.04)' : selected ? 'translateY(-3px)' : 'none',
          transition: 'filter 220ms ease, transform 220ms ease',
          width: 82,
        }}
      >
        <span
          style={{
            background: `linear-gradient(145deg, ${boxColor}, color-mix(in srgb, ${boxColor} 72%, #17142B))`,
            border: '1px solid rgba(255,255,255,0.34)',
            borderRadius: 6,
            bottom: 2,
            boxShadow: 'inset -8px -8px 14px rgba(23,20,43,0.2), 0 10px 14px rgba(37,25,77,0.2)',
            height: 52,
            left: 8,
            overflow: 'hidden',
            position: 'absolute',
            width: 66,
          }}
        >
          <span
            style={{
              background: 'rgba(23,20,43,0.34)',
              height: 9,
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          />
          <span
            style={{
              background: accentColor,
              bottom: 0,
              left: 27,
              position: 'absolute',
              top: 0,
              width: 12,
            }}
          />
        </span>
        <span
          data-jackpotkit-lucky-gift-lid=""
          style={{
            background: `linear-gradient(145deg, color-mix(in srgb, ${boxColor} 78%, #FFFFFF), ${boxColor})`,
            border: '1px solid rgba(255,255,255,0.45)',
            borderRadius: 7,
            boxShadow: '0 5px 8px rgba(37,25,77,0.25)',
            height: 24,
            left: 2,
            position: 'absolute',
            top: 24,
            transform: winning ? 'translate(-8px, -25px) rotate(-13deg)' : 'none',
            transformOrigin: '12px 20px',
            transition: 'transform 360ms cubic-bezier(0.2, 1.35, 0.4, 1)',
            width: 78,
            zIndex: 3,
          }}
        >
          <span
            style={{
              background: accentColor,
              bottom: 0,
              left: 33,
              position: 'absolute',
              top: 0,
              width: 12,
            }}
          />
          <span
            style={{
              background: accentColor,
              borderRadius: '70% 35% 70% 35%',
              height: 18,
              left: 20,
              position: 'absolute',
              top: -14,
              transform: 'rotate(28deg)',
              width: 19,
            }}
          />
          <span
            style={{
              background: accentColor,
              borderRadius: '35% 70% 35% 70%',
              height: 18,
              left: 43,
              position: 'absolute',
              top: -14,
              transform: 'rotate(-28deg)',
              width: 19,
            }}
          />
          <span
            style={{
              background: accentColor,
              border: '2px solid rgba(255,255,255,0.45)',
              borderRadius: '50%',
              height: 14,
              left: 32,
              position: 'absolute',
              top: -9,
              width: 14,
            }}
          />
        </span>
      </span>
      <span
        style={{
          background: selected ? accentColor : 'transparent',
          borderRadius: 999,
          color: selected ? '#17142B' : 'inherit',
          fontSize: 12,
          fontWeight: 900,
          lineHeight: 1.2,
          maxWidth: '100%',
          overflow: 'hidden',
          padding: '4px 8px',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {winning ? '★ ' : ''}
        {label}
        {disabled ? ' · unavailable' : ''}
      </span>
    </span>
  );
}

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
    faceStyle = 'tiles',
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
  const giftColors = [
    theme.colors.primary,
    theme.colors.coinFront,
    theme.colors.wheelPalette[3] ?? theme.colors.scratchAccent,
    theme.colors.coinBack,
  ];
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
        {boxes.map((box, index) => {
          const selected = controller.selectedBoxId === box.id;
          const winning = displayResult?.winningBox.id === box.id;
          const buttonDisabled = disabled || box.disabled === true;
          const giftFace = faceStyle === 'gift-boxes' && renderBox === undefined;
          return (
            <button
              aria-pressed={selected}
              disabled={buttonDisabled}
              key={box.id}
              onClick={() => controller.select(box.id)}
              style={{
                background: giftFace
                  ? selected
                    ? 'rgba(243, 167, 18, 0.12)'
                    : 'transparent'
                  : selected
                    ? theme.colors.luckyBoxSelected
                    : theme.colors.luckyBox,
                border: giftFace
                  ? `2px solid ${selected ? theme.colors.primary : 'transparent'}`
                  : `${winning ? 3 : 2}px solid ${winning ? theme.colors.primary : theme.colors.border}`,
                borderRadius: theme.radii.md,
                color: selected ? theme.colors.dicePip : theme.colors.text,
                cursor: buttonDisabled ? 'not-allowed' : 'pointer',
                fontFamily: theme.typography.fontFamily,
                fontWeight: 900,
                minHeight: giftFace ? 142 : 88,
                opacity: buttonDisabled && !winning ? (giftFace ? 0.58 : 0.7) : 1,
                padding: giftFace ? 4 : theme.spacing.sm,
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
              }) ??
                (giftFace ? (
                  <GiftBoxFace
                    accentColor={theme.colors.scratchAccent}
                    boxColor={giftColors[index % giftColors.length] ?? theme.colors.primary}
                    disabled={box.disabled === true}
                    label={box.label ?? box.id}
                    opening={winning && revealing}
                    selected={selected}
                    winning={winning}
                  />
                ) : (
                  <>
                    {winning ? '★ ' : ''}
                    {box.label ?? box.id}
                    {box.disabled === true ? ' · unavailable' : ''}
                  </>
                ))}
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
