import {
  createScratchProgressTracker,
  type ScratchCardResult,
  type ScratchPoint,
} from '@jackpotkit/core';
import { createJackpotTheme } from '@jackpotkit/theme';
import {
  Canvas,
  Circle,
  Group,
  Image,
  Paint,
  Path,
  RoundedRect,
  Skia,
  useImage,
} from '@shopify/react-native-skia';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type RefAttributes,
} from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useJackpotKitTheme } from '../theme-provider';
import type { ScratchCardProps, ScratchCardRef } from './types';
import { useScratchCardController } from './use-scratch-card';
import { assertScratchCardComponentConfiguration } from './validation';

interface ScratchStroke {
  readonly points: readonly ScratchPoint[];
}

function buildScratchPath(
  strokes: readonly ScratchStroke[],
  brushRadius: number,
  fringe: -1 | 0 | 1,
) {
  const builder = Skia.PathBuilder.Make();

  strokes.forEach((stroke, strokeIndex) => {
    const points = stroke.points.map((point, pointIndex) => {
      if (fringe === 0) return point;
      const angle = strokeIndex * 0.83 + pointIndex * 1.91;
      const distance = brushRadius * 0.67 * fringe;
      return {
        x: point.x + Math.cos(angle) * distance,
        y: point.y + Math.sin(angle) * distance,
      };
    });
    const first = points[0];
    if (first === undefined) return;
    builder.moveTo(first.x, first.y);
    if (points.length === 1) builder.lineTo(first.x + 0.01, first.y);
    else for (const point of points.slice(1)) builder.lineTo(point.x, point.y);
  });

  return builder.build();
}

const AnimatedView = Animated.createAnimatedComponent(View);

function ScratchCardInner<TPrize = unknown, TRequest = void>(
  props: ScratchCardProps<TPrize, TRequest>,
  ref: React.ForwardedRef<ScratchCardRef<TPrize>>,
) {
  const {
    accessibilityLabel,
    accessibilityLabels = {},
    autoReveal = true,
    borderRadius,
    brushRadius = 18,
    children,
    cover = { type: 'solid' },
    height,
    reduceMotion,
    renderCover,
    revealDuration,
    status: controlledStatus,
    style,
    theme: themeOverride,
    threshold = 0.65,
    width,
  } = props;
  const providerTheme = useJackpotKitTheme();
  const theme = useMemo(
    () => createJackpotTheme(themeOverride, providerTheme),
    [providerTheme, themeOverride],
  );
  assertScratchCardComponentConfiguration(props);
  const controller = useScratchCardController(props, false);
  const tracker = useMemo(
    () => createScratchProgressTracker({ brushRadius, height, width }),
    [brushRadius, height, width],
  );
  const image = useImage(cover.type === 'image' ? cover.source : null);
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion === true || systemReducedMotion;
  const resolvedBorderRadius = borderRadius ?? theme.radii.md;
  const coverOpacity = useSharedValue(1);
  const [strokes, setStrokes] = useState<readonly ScratchStroke[]>([]);
  const [revealed, setRevealed] = useState(false);
  const previousPointRef = useRef<ScratchPoint | undefined>(undefined);
  const completionTriggeredRef = useRef(false);
  const mountedRef = useRef(true);
  const status = controlledStatus ?? controller.status;
  const isDisabled = props.disabled === true || status === 'disabled' || revealed;
  const labels = useMemo(
    () => ({
      card: accessibilityLabels.card ?? accessibilityLabel ?? 'Scratch Card',
      disabled: accessibilityLabels.disabled ?? 'Scratch Card disabled',
      progress:
        accessibilityLabels.progress ??
        ((progress: number) => `${Math.round(progress * 100)} percent scratched`),
      result: accessibilityLabels.result ?? (() => 'Scratch Card revealed'),
      reveal: accessibilityLabels.reveal ?? 'Reveal Scratch Card',
    }),
    [accessibilityLabel, accessibilityLabels],
  );

  const scratchPaths = useMemo(() => {
    return {
      center: buildScratchPath(strokes, brushRadius, 0),
      leftFringe: buildScratchPath(strokes, brushRadius, -1),
      rightFringe: buildScratchPath(strokes, brushRadius, 1),
    };
  }, [brushRadius, strokes]);

  const foilTexturePath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    for (let offset = -height; offset < width + height; offset += 16) {
      builder.moveTo(offset, height);
      builder.lineTo(offset + height, 0);
    }
    return builder.build();
  }, [height, width]);

  const animatedCoverStyle = useAnimatedStyle(() => ({ opacity: coverOpacity.value }));

  const finishReveal = useCallback(
    (result: ScratchCardResult<TPrize>) => {
      if (!mountedRef.current) return;
      controller.finishReveal(result);
      AccessibilityInfo.announceForAccessibility(labels.result(result));
    },
    [controller, labels],
  );

  const animateReveal = useCallback(
    (result: ScratchCardResult<TPrize>, emitRevealStart: boolean) => {
      if (emitRevealStart) controller.startReveal(result);
      const duration = shouldReduceMotion
        ? theme.animation.reducedMotionDuration
        : (revealDuration ?? theme.animation.revealDuration);

      coverOpacity.set(
        withTiming(0, { duration }, (finished) => {
          if (finished) runOnJS(finishReveal)(result);
        }),
      );
    },
    [controller, coverOpacity, finishReveal, revealDuration, shouldReduceMotion, theme.animation],
  );

  const handleThreshold = useCallback(
    (result: ScratchCardResult<TPrize>) => {
      if (completionTriggeredRef.current) return;
      completionTriggeredRef.current = true;

      if (autoReveal) {
        setRevealed(true);
        animateReveal(result, true);
      } else {
        controller.complete(result);
        AccessibilityInfo.announceForAccessibility(labels.result(result));
      }
    },
    [animateReveal, autoReveal, controller, labels],
  );

  const processProgress = useCallback(
    (nextProgress: number) => {
      const update = controller.scratch(nextProgress);
      if (update.completed) {
        void controller
          .begin()
          .then(handleThreshold)
          .catch(() => undefined);
      }
    },
    [controller, handleThreshold],
  );

  const beginStroke = useCallback(
    (point: ScratchPoint) => {
      if (isDisabled) return;
      previousPointRef.current = point;
      setStrokes((current) => [...current, { points: [point] }]);
      processProgress(tracker.scratchPoint(point));
      void controller
        .begin()
        .then((result) => {
          if (tracker.progress >= threshold) handleThreshold(result);
        })
        .catch(() => undefined);
    },
    [controller, handleThreshold, isDisabled, processProgress, threshold, tracker],
  );

  const continueStroke = useCallback(
    (point: ScratchPoint) => {
      if (isDisabled) return;
      const previous = previousPointRef.current ?? point;
      previousPointRef.current = point;
      setStrokes((current) => {
        const last = current.at(-1);
        if (last === undefined) return [...current, { points: [point] }];
        return [...current.slice(0, -1), { points: [...last.points, point] }];
      });
      processProgress(tracker.scratchLine(previous, point));
    },
    [isDisabled, processProgress, tracker],
  );

  const endStroke = useCallback(() => {
    previousPointRef.current = undefined;
  }, []);

  /* Gesture Handler stores these callbacks for post-render native events. The refs they reach are
     deliberately event-only state, despite the React lint rule treating the builder as execution. */
  /* eslint-disable react-hooks/refs */
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .withTestId('jackpotkit-scratch-gesture')
        .enabled(!isDisabled)
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .runOnJS(true)
        .onBegin((event) => beginStroke({ x: event.x, y: event.y }))
        .onUpdate((event) => continueStroke({ x: event.x, y: event.y }))
        .onFinalize(endStroke),
    [beginStroke, continueStroke, endStroke, isDisabled],
  );
  /* eslint-enable react-hooks/refs */

  const reveal = useCallback(async () => {
    if (revealed && controller.result !== undefined) {
      return controller.result;
    }

    const result = await controller.reveal();
    completionTriggeredRef.current = true;
    setRevealed(true);
    animateReveal(result, false);
    return result;
  }, [animateReveal, controller, revealed]);

  const reset = useCallback(() => {
    cancelAnimation(coverOpacity);
    coverOpacity.set(1);
    completionTriggeredRef.current = false;
    previousPointRef.current = undefined;
    tracker.reset();
    setStrokes([]);
    setRevealed(false);
    controller.reset();
  }, [controller, coverOpacity, tracker]);

  useImperativeHandle(ref, () => ({ reset, reveal }), [reset, reveal]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelAnimation(coverOpacity);
    };
  }, [coverOpacity]);

  const hiddenContent = typeof children === 'function' ? children(controller.result) : children;
  const coverColor =
    cover.type === 'solid'
      ? (cover.color ?? theme.colors.scratchCover)
      : (cover.fallbackColor ?? theme.colors.scratchCover);

  return (
    <View
      accessibilityActions={[{ name: 'activate', label: labels.reveal }]}
      accessibilityHint={isDisabled ? labels.disabled : labels.reveal}
      accessibilityLabel={`${labels.card}. ${labels.progress(controller.progress)}.`}
      accessibilityRole="button"
      accessibilityState={{ busy: status === 'requesting-result', disabled: isDisabled }}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate' && !isDisabled) {
          void reveal().catch(() => undefined);
        }
      }}
      style={[
        {
          borderCurve: 'continuous',
          borderRadius: resolvedBorderRadius,
          height,
          overflow: 'hidden',
          width,
        },
        style,
      ]}
      testID="jackpotkit-scratch-card"
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          height,
          justifyContent: 'center',
          width,
        }}
      >
        {hiddenContent}
      </View>

      <AnimatedView
        pointerEvents={isDisabled ? 'none' : 'auto'}
        style={[{ ...StyleSheetAbsoluteFill, height, width }, animatedCoverStyle]}
      >
        <GestureDetector gesture={gesture}>
          <View style={{ height, width }}>
            <Canvas pointerEvents="none" style={{ height, width }}>
              <Group layer={<Paint />}>
                <RoundedRect
                  color={coverColor}
                  height={height}
                  r={resolvedBorderRadius}
                  width={width}
                  x={0}
                  y={0}
                />
                <Path
                  color="#FFFFFF"
                  opacity={0.16}
                  path={foilTexturePath}
                  strokeWidth={1}
                  style="stroke"
                />
                {Array.from(
                  { length: Math.max(14, Math.round((width * height) / 1_800)) },
                  (_, index) => (
                    <Circle
                      color={index % 3 === 0 ? theme.colors.scratchAccent : '#FFFFFF'}
                      cx={((index * 47 + 19) % 101) * (width / 101)}
                      cy={((index * 71 + 13) % 97) * (height / 97)}
                      key={index}
                      opacity={0.18 + (index % 4) * 0.05}
                      r={0.8 + (index % 3) * 0.4}
                    />
                  ),
                )}
                <RoundedRect
                  color="#FFFFFF"
                  height={Math.max(34, height * 0.3)}
                  opacity={0.14}
                  r={8}
                  width={width * 0.84}
                  x={width * 0.08}
                  y={(height - Math.max(34, height * 0.3)) / 2}
                />
                {cover.type === 'image' && image !== null ? (
                  <Image
                    fit={cover.fit ?? 'cover'}
                    height={height}
                    image={image}
                    width={width}
                    x={0}
                    y={0}
                  />
                ) : null}
                {renderCover?.({ height, theme, width })}
                <Path
                  blendMode="clear"
                  path={scratchPaths.center}
                  strokeCap="round"
                  strokeJoin="round"
                  strokeWidth={brushRadius * 1.45}
                  style="stroke"
                />
                <Path
                  blendMode="clear"
                  path={scratchPaths.leftFringe}
                  strokeCap="round"
                  strokeJoin="round"
                  strokeWidth={brushRadius * 0.55}
                  style="stroke"
                />
                <Path
                  blendMode="clear"
                  path={scratchPaths.rightFringe}
                  strokeCap="round"
                  strokeJoin="round"
                  strokeWidth={brushRadius * 0.48}
                  style="stroke"
                />
              </Group>
            </Canvas>
          </View>
        </GestureDetector>
      </AnimatedView>
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  bottom: 0,
  left: 0,
  position: 'absolute' as const,
  right: 0,
  top: 0,
};

export const ScratchCard = forwardRef(ScratchCardInner) as <TPrize = unknown, TRequest = void>(
  props: ScratchCardProps<TPrize, TRequest> & RefAttributes<ScratchCardRef<TPrize>>,
) => ReactElement;
