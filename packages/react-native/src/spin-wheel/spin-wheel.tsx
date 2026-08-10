import {
  AnimationError,
  calculateSpinWheelDestination,
  type SpinWheelResult,
} from '@jackpotkit/core';
import { createJackpotTheme } from '@jackpotkit/theme';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactElement,
  type RefAttributes,
} from 'react';
import { AccessibilityInfo, Pressable, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useJackpotKitTheme } from '../theme-provider';
import { createSegmentPath, getSegmentLabelPosition } from './geometry';
import type { SpinWheelProps, SpinWheelRef } from './types';
import { useSpinWheelController } from './use-spin-wheel';
import { assertSpinWheelComponentConfiguration } from './validation';

interface PendingAnimation<TValue> {
  readonly operation: number;
  readonly reject: (error: unknown) => void;
  readonly resolve: (result: SpinWheelResult<TValue>) => void;
  readonly result: SpinWheelResult<TValue>;
}

const AnimatedView = Animated.createAnimatedComponent(View);

function SpinWheelInner<TValue = unknown, TRequest = void>(
  props: SpinWheelProps<TValue, TRequest>,
  ref: React.ForwardedRef<SpinWheelRef<TValue>>,
) {
  const {
    accessibilityLabel,
    accessibilityLabels = {},
    direction = 'clockwise',
    duration,
    easing = Easing.out(Easing.cubic),
    reduceMotion,
    renderPointer,
    renderSegment,
    rotations,
    size,
    status: controlledStatus,
    style,
    theme: themeOverride,
  } = props;
  const providerTheme = useJackpotKitTheme();
  const theme = useMemo(
    () => createJackpotTheme(themeOverride, providerTheme),
    [providerTheme, themeOverride],
  );
  assertSpinWheelComponentConfiguration(props, theme);
  const controller = useSpinWheelController(props, false);
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion === true || systemReducedMotion;
  const { width: windowWidth } = useWindowDimensions();
  const wheelSize = size ?? Math.min(420, Math.max(160, windowWidth - 48));
  const rotation = useSharedValue(0);
  const currentRotationRef = useRef(0);
  const operationRef = useRef(0);
  const pendingRef = useRef<PendingAnimation<TValue> | undefined>(undefined);
  const mountedRef = useRef(true);
  const status = controlledStatus ?? controller.status;
  const isBusy =
    status === 'requesting-result' ||
    status === 'playing' ||
    status === 'revealing' ||
    controller.status === 'requesting-result' ||
    controller.status === 'playing' ||
    controller.status === 'revealing';
  const isDisabled = props.disabled === true || status === 'disabled' || isBusy;
  const labels = useMemo(
    () => ({
      result:
        accessibilityLabels.result ??
        ((result: SpinWheelResult<TValue>) =>
          `Selected ${result.segment.label ?? result.segment.id}.`),
      spin: accessibilityLabels.spin ?? 'Spin',
      spinning: accessibilityLabels.spinning ?? 'Spinning',
      wheel: accessibilityLabels.wheel ?? accessibilityLabel ?? 'Spin Wheel',
    }),
    [accessibilityLabel, accessibilityLabels],
  );
  const segmentGeometry = useMemo(
    () =>
      props.segments.map((segment, index) => ({
        index,
        path: createSegmentPath(index, props.segments.length, wheelSize),
        position: getSegmentLabelPosition(index, props.segments.length, wheelSize),
        segment,
      })),
    [props.segments, wheelSize],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const finishAnimation = useCallback(
    (operation: number) => {
      const pending = pendingRef.current;

      if (pending === undefined || pending.operation !== operation || !mountedRef.current) {
        return;
      }

      pendingRef.current = undefined;
      controller.reveal(pending.result);
      controller.complete(pending.result);
      AccessibilityInfo.announceForAccessibility(labels.result(pending.result));
      pending.resolve(pending.result);
    },
    [controller, labels],
  );

  const animateResult = useCallback(
    (result: SpinWheelResult<TValue>): Promise<SpinWheelResult<TValue>> => {
      const segmentIndex = props.segments.findIndex((segment) => segment.id === result.segmentId);
      const operation = ++operationRef.current;
      const destination = calculateSpinWheelDestination({
        currentRotation: currentRotationRef.current,
        direction,
        rotations: shouldReduceMotion ? 0 : (rotations ?? theme.animation.spinRotations),
        segmentCount: props.segments.length,
        segmentIndex,
      });
      const animationDuration = shouldReduceMotion
        ? theme.animation.reducedMotionDuration
        : (duration ?? theme.animation.spinDuration);

      currentRotationRef.current = destination;
      controller.startAnimation(result);

      return new Promise((resolve, reject) => {
        pendingRef.current = { operation, reject, resolve, result };
        rotation.value = withTiming(
          destination,
          { duration: animationDuration, easing },
          (finished) => {
            if (finished) {
              runOnJS(finishAnimation)(operation);
            }
          },
        );
      });
    },
    [
      controller,
      direction,
      duration,
      easing,
      finishAnimation,
      props,
      rotation,
      rotations,
      shouldReduceMotion,
      theme.animation,
    ],
  );

  const play = useCallback(
    async (segmentId?: string) => {
      const result =
        segmentId === undefined ? await controller.spin() : await controller.spinTo(segmentId);
      return animateResult(result);
    },
    [animateResult, controller],
  );

  const reset = useCallback(() => {
    operationRef.current += 1;
    cancelAnimation(rotation);
    const pending = pendingRef.current;
    pendingRef.current = undefined;

    if (pending !== undefined) {
      pending.reject(new AnimationError('The Spin Wheel animation was reset before completion.'));
    }

    currentRotationRef.current = 0;
    rotation.set(0);
    controller.reset();
  }, [controller, rotation]);

  useImperativeHandle(
    ref,
    () => ({
      reset,
      spin: () => play(),
      spinTo: (segmentId) => play(segmentId),
    }),
    [play, reset],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      operationRef.current += 1;
      cancelAnimation(rotation);
      pendingRef.current?.reject(
        new AnimationError('The Spin Wheel unmounted before its animation completed.'),
      );
      pendingRef.current = undefined;
    };
  }, [rotation]);

  const handlePress = () => {
    void play().catch(() => undefined);
  };

  const labelWidth = Math.max(54, wheelSize * 0.24);

  return (
    <View
      accessibilityLabel={labels.wheel}
      style={[{ alignItems: 'center', gap: theme.spacing.md, width: '100%' }, style]}
    >
      <View style={{ height: wheelSize + 18, width: wheelSize }}>
        <AnimatedView
          style={[
            {
              borderColor: theme.colors.border,
              borderRadius: wheelSize / 2,
              borderWidth: 3,
              height: wheelSize,
              overflow: 'hidden',
              width: wheelSize,
            },
            animatedStyle,
          ]}
        >
          <Svg
            accessibilityElementsHidden
            height={wheelSize}
            importantForAccessibility="no-hide-descendants"
            width={wheelSize}
          >
            {props.segments.length === 1 ? (
              <Circle
                cx={wheelSize / 2}
                cy={wheelSize / 2}
                fill={
                  props.segments[0]?.color ?? theme.colors.wheelPalette[0] ?? theme.colors.primary
                }
                r={wheelSize / 2}
              />
            ) : (
              segmentGeometry.map(({ index, path, segment }) => (
                <Path
                  d={path}
                  fill={
                    segment.color ??
                    theme.colors.wheelPalette[index % theme.colors.wheelPalette.length] ??
                    theme.colors.primary
                  }
                  key={segment.id}
                  stroke={theme.colors.surface}
                  strokeWidth={2}
                />
              ))
            )}
          </Svg>

          {segmentGeometry.map(({ index, position, segment }) => {
            const selected = status === 'completed' && controller.result?.segmentId === segment.id;

            return (
              <View
                key={segment.id}
                pointerEvents="none"
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  left: position.x - labelWidth / 2,
                  minHeight: 36,
                  position: 'absolute',
                  top: position.y - 18,
                  width: labelWidth,
                }}
              >
                {renderSegment === undefined ? (
                  <Text
                    numberOfLines={2}
                    selectable
                    style={{
                      color: theme.colors.onPrimary,
                      fontFamily: theme.typography.fontFamily,
                      fontSize: theme.typography.labelSize,
                      fontWeight: '800',
                      textAlign: 'center',
                    }}
                  >
                    {segment.label ?? segment.id}
                  </Text>
                ) : (
                  renderSegment({ index, segment, selected, theme })
                )}
              </View>
            );
          })}
        </AnimatedView>

        <View
          pointerEvents="none"
          style={{ alignItems: 'center', left: 0, position: 'absolute', right: 0, top: -2 }}
        >
          {renderPointer === undefined ? (
            <View
              style={{
                borderLeftColor: 'transparent',
                borderLeftWidth: 14,
                borderRightColor: 'transparent',
                borderRightWidth: 14,
                borderTopColor: theme.colors.pointer,
                borderTopWidth: 28,
                height: 0,
                width: 0,
              }}
            />
          ) : (
            renderPointer(theme)
          )}
        </View>

        <Pressable
          accessibilityLabel={isBusy ? labels.spinning : labels.spin}
          accessibilityRole="button"
          accessibilityState={{ busy: isBusy, disabled: isDisabled }}
          disabled={isDisabled}
          onPress={handlePress}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.surface,
            borderRadius: theme.radii.full,
            borderWidth: 4,
            height: 76,
            justifyContent: 'center',
            left: wheelSize / 2 - 38,
            opacity: isDisabled ? 0.72 : pressed ? 0.86 : 1,
            position: 'absolute',
            top: wheelSize / 2 - 38,
            width: 76,
          })}
        >
          <Text
            selectable
            style={{
              color: theme.colors.onPrimary,
              fontFamily: theme.typography.fontFamily,
              fontSize: 14,
              fontWeight: '900',
            }}
          >
            {isBusy ? labels.spinning : labels.spin}
          </Text>
        </Pressable>
      </View>

      {controller.result !== undefined && status === 'completed' ? (
        <Text
          accessibilityLiveRegion="polite"
          selectable
          style={{
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.titleSize,
            fontWeight: '800',
            textAlign: 'center',
          }}
        >
          {labels.result(controller.result)}
        </Text>
      ) : null}
    </View>
  );
}

export const SpinWheel = forwardRef(SpinWheelInner) as <TValue = unknown, TRequest = void>(
  props: SpinWheelProps<TValue, TRequest> & RefAttributes<SpinWheelRef<TValue>>,
) => ReactElement;
