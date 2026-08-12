import {
  createScratchProgressTracker,
  type ScratchCardResult,
  type ScratchPoint,
} from '@jackpotkit/core';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { actionButtonStyle } from '../internal/styles.js';
import { useAnimationWaiter } from '../internal/use-animation-waiter.js';
import { useReducedMotion } from '../internal/use-reduced-motion.js';
import { useResolvedTheme } from '../internal/use-resolved-theme.js';
import type { ScratchCardProps, ScratchCardRef } from './types.js';
import { useScratchCardController } from './use-scratch-card.js';

function ScratchCardInner<TPrize = unknown, TRequest = void>(
  props: ScratchCardProps<TPrize, TRequest>,
  ref: React.ForwardedRef<ScratchCardRef<TPrize>>,
) {
  const {
    accessibilityLabel = 'Scratch Card',
    autoReveal = true,
    borderRadius = 16,
    brushRadius = 24,
    children,
    cover = { type: 'solid' },
    height,
    reduceMotion,
    renderCover,
    revealDuration,
    style,
    className,
    width,
  } = props;
  const theme = useResolvedTheme(props.theme);
  const controller = useScratchCardController(props, false);
  const tracker = useMemo(
    () => createScratchProgressTracker({ brushRadius, height, width }),
    [brushRadius, height, width],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<ScratchPoint | undefined>(undefined);
  const scratchingRef = useRef(false);
  const revealingRef = useRef(false);
  const [coverVisible, setCoverVisible] = useState(true);
  const [resetVersion, setResetVersion] = useState(0);
  const shouldReduceMotion = useReducedMotion(reduceMotion);
  const { cancel, wait } = useAnimationWaiter('Scratch Card');
  const animationDuration = shouldReduceMotion
    ? theme.animation.reducedMotionDuration
    : (revealDuration ?? theme.animation.revealDuration);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const context = canvas.getContext('2d');
    if (context === null) return;
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, width, height);
    const fallback =
      cover.type === 'solid'
        ? (cover.color ?? theme.colors.scratchCover)
        : (cover.fallbackColor ?? theme.colors.scratchCover);
    context.fillStyle = fallback;
    context.fillRect(0, 0, width, height);
    if (cover.type === 'image' && typeof Image !== 'undefined') {
      const image = new Image();
      if (cover.crossOrigin !== undefined) image.crossOrigin = cover.crossOrigin;
      image.addEventListener(
        'load',
        () => {
          context.globalCompositeOperation = 'source-over';
          context.drawImage(image, 0, 0, width, height);
        },
        { once: true },
      );
      image.src = cover.source;
    }
  }, [cover, height, resetVersion, theme.colors.scratchCover, width]);
  const getPoint = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>): ScratchPoint => {
      const rect = event.currentTarget.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (width / rect.width),
        y: (event.clientY - rect.top) * (height / rect.height),
      };
    },
    [height, width],
  );
  const finishReveal = useCallback(
    async (result: ScratchCardResult<TPrize>) => {
      if (revealingRef.current) return result;
      revealingRef.current = true;
      controller.startReveal(result);
      setCoverVisible(false);
      try {
        await wait(animationDuration);
        controller.complete(result);
        return result;
      } finally {
        revealingRef.current = false;
      }
    },
    [animationDuration, controller, wait],
  );
  const updateScratch = useCallback(
    (point: ScratchPoint) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      const previous = lastPointRef.current ?? point;
      if (context !== null && context !== undefined) {
        context.globalCompositeOperation = 'destination-out';
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = brushRadius * 2;
        context.beginPath();
        context.moveTo(previous.x, previous.y);
        context.lineTo(point.x, point.y);
        context.stroke();
      }
      const progress = tracker.scratchLine(previous, point);
      const update = controller.scratch(progress);
      lastPointRef.current = point;
      if (autoReveal && update.completed)
        void controller
          .begin()
          .then(finishReveal)
          .catch(() => undefined);
    },
    [autoReveal, brushRadius, controller, finishReveal, tracker],
  );
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (props.disabled === true || !coverVisible) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      scratchingRef.current = true;
      const point = getPoint(event);
      lastPointRef.current = point;
      void controller
        .begin()
        .then(() => updateScratch(point))
        .catch(() => undefined);
    },
    [controller, coverVisible, getPoint, props.disabled, updateScratch],
  );
  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (scratchingRef.current) updateScratch(getPoint(event));
    },
    [getPoint, updateScratch],
  );
  const stopScratch = useCallback(() => {
    scratchingRef.current = false;
    lastPointRef.current = undefined;
  }, []);
  const reveal = useCallback(
    async () => finishReveal(await controller.reveal()),
    [controller, finishReveal],
  );
  const reset = useCallback(() => {
    cancel('Scratch Card was reset before its reveal completed.');
    tracker.reset();
    scratchingRef.current = false;
    revealingRef.current = false;
    lastPointRef.current = undefined;
    setCoverVisible(true);
    setResetVersion((value) => value + 1);
    controller.reset();
  }, [cancel, controller, tracker]);
  useImperativeHandle(ref, () => ({ reset, reveal }), [reset, reveal]);
  const content = typeof children === 'function' ? children(controller.result) : children;
  const disabled = props.disabled === true || controller.status === 'requesting-result';
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
      <div style={{ borderRadius, height, overflow: 'hidden', position: 'relative', width }}>
        <div
          style={{
            alignItems: 'center',
            background: theme.colors.surface,
            color: theme.colors.text,
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {content}
        </div>
        {renderCover === undefined ? null : (
          <div
            aria-hidden="true"
            style={{
              inset: 0,
              opacity: coverVisible ? 1 : 0,
              pointerEvents: 'none',
              position: 'absolute',
              transition: `opacity ${animationDuration}ms ease`,
            }}
          >
            {renderCover({ height, theme, width })}
          </div>
        )}
        <canvas
          aria-label={`${Math.round(controller.progress * 100)} percent scratched`}
          height={height}
          onPointerCancel={stopScratch}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopScratch}
          ref={canvasRef}
          style={{
            cursor: disabled ? 'not-allowed' : 'crosshair',
            height,
            inset: 0,
            opacity: coverVisible ? 1 : 0,
            position: 'absolute',
            touchAction: 'none',
            transition: `opacity ${animationDuration}ms ease`,
            width,
          }}
          width={width}
        />
      </div>
      <button
        disabled={disabled || !coverVisible}
        onClick={() => void reveal().catch(() => undefined)}
        style={actionButtonStyle(theme, disabled || !coverVisible)}
        type="button"
      >
        Reveal card
      </button>
      <div
        aria-live="polite"
        role="status"
        style={{ color: theme.colors.text, fontFamily: theme.typography.fontFamily, minHeight: 22 }}
      >
        {controller.status === 'completed'
          ? 'Prize revealed'
          : `${Math.round(controller.progress * 100)}% scratched`}
      </div>
    </div>
  );
}
export const ScratchCard = forwardRef(ScratchCardInner) as <TPrize = unknown, TRequest = void>(
  props: ScratchCardProps<TPrize, TRequest> & React.RefAttributes<ScratchCardRef<TPrize>>,
) => React.ReactElement;
