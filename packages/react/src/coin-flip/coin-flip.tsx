import {
  DEFAULT_COIN_FACES,
  type CoinFace,
  type CoinFlipResult,
  type CoinFlipSelection,
} from '@jackpotkit/core';
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { actionButtonStyle } from '../internal/styles.js';
import { useAnimationWaiter } from '../internal/use-animation-waiter.js';
import { useReducedMotion } from '../internal/use-reduced-motion.js';
import { useResolvedTheme } from '../internal/use-resolved-theme.js';
import type { CoinFlipProps, CoinFlipRef } from './types.js';
import { useCoinFlipController } from './use-coin-flip.js';

function CoinFlipInner<TValue = unknown, TRequest = void>(
  props: CoinFlipProps<TValue, TRequest>,
  ref: React.ForwardedRef<CoinFlipRef<TValue>>,
) {
  const {
    accessibilityLabel = 'Coin Flip',
    duration,
    easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
    faces,
    reduceMotion,
    renderFace,
    size = 160,
    style,
    className,
  } = props;
  if (!Number.isFinite(size) || size <= 0)
    throw new RangeError('Coin Flip size must be a positive finite number.');
  const theme = useResolvedTheme(props.theme);
  const controller = useCoinFlipController(props, false);
  const coinFaces = (faces ?? DEFAULT_COIN_FACES) as readonly CoinFace<TValue>[];
  const [faceId, setFaceId] = useState(coinFaces[0]?.id ?? 'heads');
  const [flipping, setFlipping] = useState(false);
  const [turns, setTurns] = useState(0);
  const shouldReduceMotion = useReducedMotion(reduceMotion);
  const { cancel, wait } = useAnimationWaiter('Coin Flip');
  const animationDuration = shouldReduceMotion
    ? theme.animation.reducedMotionDuration
    : (duration ?? theme.animation.coinFlipDuration);
  const animate = useCallback(
    async (result: CoinFlipResult<TValue>) => {
      controller.startAnimation(result);
      setFlipping(true);
      setFaceId(result.faceId);
      setTurns((value) => value + 3);
      await wait(animationDuration);
      setFlipping(false);
      controller.reveal(result);
      controller.complete(result);
      return result;
    },
    [animationDuration, controller, wait],
  );
  const flip = useCallback(
    async (selection?: CoinFlipSelection) => animate(await controller.play(selection)),
    [animate, controller],
  );
  const reset = useCallback(() => {
    cancel('Coin Flip was reset before its animation completed.');
    setFaceId(coinFaces[0]?.id ?? 'heads');
    setFlipping(false);
    setTurns(0);
    controller.reset();
  }, [cancel, coinFaces, controller]);
  useImperativeHandle(ref, () => ({ flip: () => flip(), flipTo: flip, reset }), [flip, reset]);
  const currentFace = coinFaces.find((face) => face.id === faceId) ?? coinFaces[0];
  const disabled = props.disabled === true || flipping || controller.status === 'requesting-result';
  return (
    <div
      aria-label={accessibilityLabel}
      className={className}
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.md,
        ...style,
      }}
    >
      <div style={{ perspective: 800 }}>
        <div
          style={{
            transform: `rotateY(${turns * 360}deg)`,
            transition: `transform ${animationDuration}ms ${easing}`,
            transformStyle: 'preserve-3d',
          }}
        >
          {currentFace === undefined
            ? null
            : (renderFace?.({ active: true, face: currentFace, flipping, theme }) ?? (
                <div
                  aria-label={`Coin face: ${currentFace.label ?? currentFace.id}`}
                  style={{
                    alignItems: 'center',
                    background:
                      currentFace.id === coinFaces[0]?.id
                        ? theme.colors.coinFront
                        : theme.colors.coinBack,
                    border: `3px solid ${theme.colors.border}`,
                    borderRadius: '50%',
                    color:
                      currentFace.id === coinFaces[0]?.id
                        ? theme.colors.dicePip
                        : theme.colors.onPrimary,
                    display: 'flex',
                    fontFamily: theme.typography.fontFamily,
                    fontSize: theme.typography.titleSize,
                    fontWeight: 900,
                    height: size,
                    justifyContent: 'center',
                    width: size,
                  }}
                >
                  {currentFace.label ?? currentFace.id}
                </div>
              ))}
        </div>
      </div>
      <button
        aria-busy={disabled}
        disabled={disabled}
        onClick={() => void flip().catch(() => undefined)}
        style={actionButtonStyle(theme, disabled)}
        type="button"
      >
        {disabled ? 'Flipping…' : 'Flip coin'}
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
        {controller.status === 'completed'
          ? `Result: ${controller.result?.face.label ?? controller.result?.face.id ?? ''}`
          : ''}
      </div>
    </div>
  );
}
export const CoinFlip = forwardRef(CoinFlipInner) as <TValue = unknown, TRequest = void>(
  props: CoinFlipProps<TValue, TRequest> & React.RefAttributes<CoinFlipRef<TValue>>,
) => React.ReactElement;
