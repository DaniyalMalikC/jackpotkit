import {
  DEFAULT_COIN_FACES,
  type CoinFace,
  type CoinFlipResult,
  type CoinFlipSelection,
} from '@jackpotkit/core';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';

import { actionButtonStyle } from '../internal/styles.js';
import { useAnimationWaiter } from '../internal/use-animation-waiter.js';
import { useReducedMotion } from '../internal/use-reduced-motion.js';
import { useResolvedTheme } from '../internal/use-resolved-theme.js';
import type { CoinFlipProps, CoinFlipRef } from './types.js';
import { useCoinFlipController } from './use-coin-flip.js';

function parseHexColor(color: string): readonly [number, number, number] | undefined {
  if (!/^#[\da-f]{6}$/i.test(color)) return undefined;
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}

function relativeLuminance(color: string): number | undefined {
  const channels = parseHexColor(color);
  if (channels === undefined) return undefined;
  const toLinear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const [red, green, blue] = channels.map(toLinear) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number | undefined {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  if (foregroundLuminance === undefined || backgroundLuminance === undefined) return undefined;
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function selectReadableColor(
  background: string,
  preferred: string,
  alternatives: readonly string[],
): string {
  const preferredRatio = contrastRatio(preferred, background);
  if (preferredRatio === undefined || preferredRatio >= 4.5) return preferred;
  return alternatives.reduce(
    (best, candidate) => {
      const ratio = contrastRatio(candidate, background) ?? 0;
      return ratio > best.ratio ? { color: candidate, ratio } : best;
    },
    { color: preferred, ratio: preferredRatio },
  ).color;
}

function CoinFlipInner<TValue = unknown, TRequest = void>(
  props: CoinFlipProps<TValue, TRequest>,
  ref: React.ForwardedRef<CoinFlipRef<TValue>>,
) {
  const {
    accessibilityLabel = 'Coin Flip',
    duration,
    easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
    faceStyle = 'flat',
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
  const [rotation, setRotation] = useState(0);
  const restingRotationRef = useRef(0);
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
      const landingRotation = result.faceId === coinFaces[0]?.id ? 0 : 180;
      const startingRotation = restingRotationRef.current;
      const destinationOffset = (landingRotation - startingRotation + 360) % 360;
      setRotation(startingRotation + (shouldReduceMotion ? 0 : 4 * 360) + destinationOffset);
      restingRotationRef.current = landingRotation;
      await wait(animationDuration);
      setFlipping(false);
      setRotation(landingRotation);
      controller.reveal(result);
      controller.complete(result);
      return result;
    },
    [animationDuration, coinFaces, controller, shouldReduceMotion, wait],
  );
  const flip = useCallback(
    async (selection?: CoinFlipSelection) => animate(await controller.play(selection)),
    [animate, controller],
  );
  const reset = useCallback(() => {
    cancel('Coin Flip was reset before its animation completed.');
    setFaceId(coinFaces[0]?.id ?? 'heads');
    setFlipping(false);
    setRotation(0);
    restingRotationRef.current = 0;
    controller.reset();
  }, [cancel, coinFaces, controller]);
  useImperativeHandle(ref, () => ({ flip: () => flip(), flipTo: flip, reset }), [flip, reset]);
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
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          height: size + 32,
          justifyContent: 'center',
          perspective: size * 5,
          width: size + 32,
        }}
      >
        <div
          style={{
            height: size,
            position: 'relative',
            transform: `rotateY(${rotation}deg)`,
            transition: flipping ? `transform ${animationDuration}ms ${easing}` : 'none',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            width: size,
          }}
        >
          {coinFaces.map((face, index) => {
            const active = face.id === faceId;
            const background = index === 0 ? theme.colors.coinFront : theme.colors.coinBack;
            const color =
              index === 0
                ? selectReadableColor(background, theme.colors.dicePip, [
                    theme.colors.onPrimary,
                    theme.colors.text,
                    theme.colors.background,
                  ])
                : theme.colors.onPrimary;
            const label = face.label ?? face.id;
            return (
              <div
                aria-hidden={!active}
                key={face.id}
                style={{
                  backfaceVisibility: 'hidden',
                  height: size,
                  inset: 0,
                  position: 'absolute',
                  transform: index === 0 ? undefined : 'rotateY(180deg)',
                  WebkitBackfaceVisibility: 'hidden',
                  visibility: !flipping && !active ? 'hidden' : 'visible',
                  width: size,
                }}
              >
                {renderFace?.({ active, face, flipping, theme }) ?? (
                  <div
                    aria-label={`Coin face: ${label}`}
                    style={{
                      alignItems: 'center',
                      background,
                      border: `${faceStyle === 'embossed' ? Math.max(4, size * 0.045) : 3}px solid ${faceStyle === 'embossed' ? color : theme.colors.border}`,
                      borderRadius: '50%',
                      boxShadow:
                        faceStyle === 'embossed'
                          ? `inset 0 0 0 ${Math.max(4, size * 0.035)}px rgb(255 255 255 / 28%), 0 12px 24px rgb(37 25 77 / 28%)`
                          : undefined,
                      color,
                      display: 'flex',
                      flexDirection: 'column',
                      fontFamily: theme.typography.fontFamily,
                      fontSize: theme.typography.titleSize,
                      fontWeight: 900,
                      height: size,
                      justifyContent: 'center',
                      width: size,
                    }}
                  >
                    {faceStyle === 'embossed' ? (
                      <span
                        data-jackpotkit-coin-rim=""
                        style={{
                          alignItems: 'center',
                          border: `${Math.max(2, size * 0.018)}px solid currentColor`,
                          borderRadius: '50%',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '76%',
                          justifyContent: 'center',
                          width: '76%',
                        }}
                      >
                        <span
                          style={{
                            fontSize: size * 0.3,
                            lineHeight: 1,
                            textTransform: 'uppercase',
                          }}
                        >
                          {label.slice(0, 1)}
                        </span>
                        <span
                          style={{
                            fontSize: Math.max(10, size * 0.085),
                            letterSpacing: 1.2,
                            opacity: flipping ? 0 : 1,
                            textTransform: 'uppercase',
                          }}
                        >
                          {label}
                        </span>
                      </span>
                    ) : (
                      <span style={{ opacity: flipping ? 0 : 1 }}>{label}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
