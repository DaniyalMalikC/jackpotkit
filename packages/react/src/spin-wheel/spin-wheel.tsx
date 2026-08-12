import { calculateSpinWheelDestination, type SpinWheelResult } from '@jackpotkit/core';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { actionButtonStyle } from '../internal/styles.js';
import { useAnimationWaiter } from '../internal/use-animation-waiter.js';
import { useReducedMotion } from '../internal/use-reduced-motion.js';
import { useResolvedTheme } from '../internal/use-resolved-theme.js';
import { createSegmentPath, getSegmentLabelPosition } from './geometry.js';
import type { SpinWheelProps, SpinWheelRef } from './types.js';
import { useSpinWheelController } from './use-spin-wheel.js';

function SpinWheelInner<TValue = unknown, TRequest = void>(
  props: SpinWheelProps<TValue, TRequest>,
  ref: React.ForwardedRef<SpinWheelRef<TValue>>,
) {
  const {
    accessibilityLabel = 'Spin Wheel',
    direction = 'clockwise',
    duration,
    easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
    reduceMotion,
    renderPointer,
    renderSegment,
    rotations,
    size = 320,
    style,
    className,
  } = props;
  if (!Number.isFinite(size) || size <= 0)
    throw new RangeError('Spin Wheel size must be a positive finite number.');
  const theme = useResolvedTheme(props.theme);
  const controller = useSpinWheelController(props, false);
  const shouldReduceMotion = useReducedMotion(reduceMotion);
  const { cancel, wait } = useAnimationWaiter('Spin Wheel');
  const currentRotation = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const geometry = useMemo(
    () =>
      props.segments.map((segment, index) => ({
        index,
        path: createSegmentPath(index, props.segments.length, size / 2),
        position: getSegmentLabelPosition(index, props.segments.length, size / 2),
        segment,
      })),
    [props.segments, size],
  );
  const animate = useCallback(
    async (result: SpinWheelResult<TValue>) => {
      const segmentIndex = props.segments.findIndex((segment) => segment.id === result.segmentId);
      const destination = calculateSpinWheelDestination({
        currentRotation: currentRotation.current,
        direction,
        rotations: shouldReduceMotion ? 0 : (rotations ?? theme.animation.spinRotations),
        segmentCount: props.segments.length,
        segmentIndex,
      });
      const animationDuration = shouldReduceMotion
        ? theme.animation.reducedMotionDuration
        : (duration ?? theme.animation.spinDuration);
      currentRotation.current = destination;
      controller.startAnimation(result);
      setAnimating(true);
      setRotation(destination);
      await wait(animationDuration);
      setAnimating(false);
      controller.reveal(result);
      controller.complete(result);
      return result;
    },
    [
      controller,
      direction,
      duration,
      props.segments,
      rotations,
      shouldReduceMotion,
      theme.animation,
      wait,
    ],
  );
  const play = useCallback(
    async (segmentId?: string) =>
      animate(await controller.play(segmentId === undefined ? undefined : { segmentId })),
    [animate, controller],
  );
  const reset = useCallback(() => {
    cancel('The Spin Wheel animation was reset before completion.');
    currentRotation.current = 0;
    setRotation(0);
    setAnimating(false);
    controller.reset();
  }, [cancel, controller]);
  useImperativeHandle(ref, () => ({ reset, spin: () => play(), spinTo: play }), [play, reset]);
  const disabled =
    props.disabled === true || animating || controller.status === 'requesting-result';
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
      <div style={{ height: size + 18, position: 'relative', width: size }}>
        <div
          style={{
            border: `3px solid ${theme.colors.border}`,
            borderRadius: '50%',
            height: size,
            overflow: 'hidden',
            position: 'relative',
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${shouldReduceMotion ? theme.animation.reducedMotionDuration : (duration ?? theme.animation.spinDuration)}ms ${easing}`,
            width: size,
          }}
        >
          <svg aria-hidden="true" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
            {geometry.map(({ index, path, segment }) => (
              <path
                d={path}
                fill={
                  segment.color ??
                  theme.colors.wheelPalette[index % theme.colors.wheelPalette.length] ??
                  theme.colors.primary
                }
                key={segment.id}
                stroke={theme.colors.surface}
                strokeWidth="2"
              />
            ))}
          </svg>
          {geometry.map(({ index, position, segment }) => (
            <div
              key={segment.id}
              style={{
                alignItems: 'center',
                color: theme.colors.onPrimary,
                display: 'flex',
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.labelSize,
                fontWeight: 900,
                justifyContent: 'center',
                left: position.x - 48,
                minHeight: 32,
                pointerEvents: 'none',
                position: 'absolute',
                textAlign: 'center',
                textShadow: '0 1px 2px rgba(0,0,0,.45)',
                top: position.y - 16,
                width: 96,
              }}
            >
              {renderSegment?.({
                index,
                segment,
                selected:
                  controller.status === 'completed' && controller.result?.segmentId === segment.id,
                theme,
              }) ??
                segment.label ??
                segment.id}
            </div>
          ))}
        </div>
        <div
          aria-hidden="true"
          style={{
            left: '50%',
            position: 'absolute',
            top: -2,
            transform: 'translateX(-50%)',
            zIndex: 1,
          }}
        >
          {renderPointer?.(theme) ?? (
            <div
              style={{
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: `24px solid ${theme.colors.pointer}`,
              }}
            />
          )}
        </div>
      </div>
      <button
        aria-busy={disabled}
        disabled={disabled}
        onClick={() => void play().catch(() => undefined)}
        style={actionButtonStyle(theme, disabled)}
        type="button"
      >
        {disabled ? 'Spinning…' : 'Spin'}
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
          ? `Selected: ${controller.result?.segment.label ?? controller.result?.segment.id ?? ''}`
          : ''}
      </div>
    </div>
  );
}
export const SpinWheel = forwardRef(SpinWheelInner) as <TValue = unknown, TRequest = void>(
  props: SpinWheelProps<TValue, TRequest> & React.RefAttributes<SpinWheelRef<TValue>>,
) => React.ReactElement;
