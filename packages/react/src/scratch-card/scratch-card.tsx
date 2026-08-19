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
import {
  drawScratchCover,
  eraseScratchSegment,
  prepareScratchCanvas,
  type ScratchSegment,
} from './canvas-renderer.js';
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
  const coverImageRef = useRef<HTMLImageElement | undefined>(undefined);
  const lastPointRef = useRef<ScratchPoint | undefined>(undefined);
  const scratchSegmentsRef = useRef<ScratchSegment[]>([]);
  const scratchingRef = useRef(false);
  const revealingRef = useRef(false);
  const [coverVisible, setCoverVisible] = useState(true);
  const [resetVersion, setResetVersion] = useState(0);
  const shouldReduceMotion = useReducedMotion(reduceMotion);
  const { cancel, wait } = useAnimationWaiter('Scratch Card');
  const animationDuration = shouldReduceMotion
    ? theme.animation.reducedMotionDuration
    : (revealDuration ?? theme.animation.revealDuration);
  const coverColor =
    cover.type === 'solid'
      ? (cover.color ?? theme.colors.scratchCover)
      : (cover.fallbackColor ?? theme.colors.scratchCover);
  const coverSource = cover.type === 'image' ? cover.source : undefined;
  const coverCrossOrigin = cover.type === 'image' ? cover.crossOrigin : undefined;
  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const context = prepareScratchCanvas(canvas, width, height);
    if (context === null) return;
    drawScratchCover(context, {
      accentColor: theme.colors.scratchAccent,
      coverColor,
      height,
      width,
    });
    if (coverImageRef.current !== undefined) {
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.drawImage(coverImageRef.current, 0, 0, width, height);
    }
    for (const segment of scratchSegmentsRef.current) {
      eraseScratchSegment(context, segment, brushRadius);
    }
  }, [brushRadius, coverColor, height, theme.colors.scratchAccent, width]);
  useEffect(() => {
    coverImageRef.current = undefined;
    paintCover();
    if (coverSource !== undefined && typeof Image !== 'undefined') {
      const image = new Image();
      if (coverCrossOrigin !== undefined) image.crossOrigin = coverCrossOrigin;
      image.addEventListener(
        'load',
        () => {
          coverImageRef.current = image;
          paintCover();
        },
        { once: true },
      );
      image.src = coverSource;
    }
  }, [coverCrossOrigin, coverSource, paintCover, resetVersion]);
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
      const segment = {
        from: previous,
        seed: scratchSegmentsRef.current.length + 1,
        to: point,
      };
      scratchSegmentsRef.current.push(segment);
      if (context !== null && context !== undefined) {
        eraseScratchSegment(context, segment, brushRadius);
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
    scratchSegmentsRef.current = [];
    coverImageRef.current = undefined;
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
      <div
        data-jackpotkit-scratch-ticket=""
        style={{
          background: theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: borderRadius + 8,
          boxShadow: '0 14px 30px rgba(37, 25, 77, 0.18)',
          padding: 10,
        }}
      >
        <div
          style={{
            alignItems: 'center',
            color: theme.colors.onPrimary,
            display: 'flex',
            fontFamily: theme.typography.fontFamily,
            fontSize: 11,
            fontWeight: 800,
            justifyContent: 'space-between',
            letterSpacing: '0.08em',
            padding: '0 4px 8px',
            textTransform: 'uppercase',
          }}
        >
          <span>Lucky reveal</span>
          <span>{Math.round(controller.progress * 100)}%</span>
        </div>
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
            data-jackpotkit-scratch-canvas=""
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
        <div
          aria-hidden="true"
          style={{
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 999,
            height: 4,
            marginTop: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: theme.colors.scratchAccent,
              borderRadius: 999,
              height: '100%',
              transition: `width ${shouldReduceMotion ? 0 : 120}ms ease-out`,
              width: `${Math.round(controller.progress * 100)}%`,
            }}
          />
        </div>
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
