import {
  AnimationError,
  DEFAULT_COIN_FACES,
  GameStateError,
  type CoinFace,
  type CoinFlipResult,
} from '@jackpotkit/core';
import { createJackpotTheme } from '@jackpotkit/theme';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useJackpotKitTheme } from '../theme-provider';
import type { CoinFlipProps, CoinFlipRef } from './types';
import { useCoinFlipController } from './use-coin-flip';

interface PendingCoinAnimation<TValue> {
  readonly operation: number;
  readonly reject: (error: unknown) => void;
  readonly resolve: (result: CoinFlipResult<TValue>) => void;
  readonly result: CoinFlipResult<TValue>;
}

function CoinFlipInner<TValue = unknown, TRequest = void>(
  props: CoinFlipProps<TValue, TRequest>,
  ref: React.ForwardedRef<CoinFlipRef<TValue>>,
) {
  const {
    accessibilityLabel = 'Coin Flip',
    duration,
    easing = Easing.out(Easing.cubic),
    faceStyle = 'flat',
    faces,
    reduceMotion,
    renderFace,
    size = 160,
    style,
    theme: themeOverride,
  } = props;
  if (!Number.isFinite(size) || size <= 0)
    throw new RangeError('Coin Flip size must be a positive finite number.');
  const providerTheme = useJackpotKitTheme();
  const theme = useMemo(
    () => createJackpotTheme(themeOverride, providerTheme),
    [providerTheme, themeOverride],
  );
  const controller = useCoinFlipController(props, false);
  const coinFaces = (faces ?? DEFAULT_COIN_FACES) as readonly CoinFace<TValue>[];
  const [faceId, setFaceId] = useState(coinFaces[0]?.id ?? 'heads');
  const [flipping, setFlipping] = useState(false);
  const rotation = useSharedValue(0);
  const motionProgress = useSharedValue(0);
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion === true || systemReducedMotion;
  const operationRef = useRef(0);
  const restingRotationRef = useRef(0);
  const mountedRef = useRef(true);
  const pendingRef = useRef<PendingCoinAnimation<TValue> | undefined>(undefined);
  const animatedStyle = useAnimatedStyle(() => {
    const progress = motionProgress.value;
    return {
      transform: [
        { translateY: interpolate(progress, [0, 0.42, 0.82, 1], [0, -24, 4, 0]) },
        { rotateZ: `${interpolate(progress, [0, 0.42, 0.82, 1], [0, 4, -2, 0])}deg` },
        { scale: interpolate(progress, [0, 0.42, 0.82, 1], [1, 0.96, 1.02, 1]) },
      ],
    };
  });
  const frontFaceStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: size * 5 }, { rotateY: `${rotation.value}deg` }],
  }));
  const backFaceStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: size * 5 }, { rotateY: `${rotation.value + 180}deg` }],
  }));
  const finishAnimation = useCallback(
    (operation: number) => {
      const pending = pendingRef.current;
      if (pending === undefined || pending.operation !== operation || !mountedRef.current) {
        return;
      }

      pendingRef.current = undefined;
      setFlipping(false);
      controller.reveal(pending.result);
      controller.complete(pending.result);
      AccessibilityInfo.announceForAccessibility(
        `Coin result: ${pending.result.face.label ?? pending.result.face.id}.`,
      );
      pending.resolve(pending.result);
    },
    [controller],
  );

  const animate = useCallback(
    (result: CoinFlipResult<TValue>) => {
      const operation = ++operationRef.current;
      controller.startAnimation(result);
      setFlipping(true);
      setFaceId(result.faceId);
      const landingRotation = result.faceId === coinFaces[0]?.id ? 0 : 180;
      const startingRotation = restingRotationRef.current;
      const destinationOffset = (landingRotation - startingRotation + 360) % 360;
      const destinationRotation =
        startingRotation + (shouldReduceMotion ? 0 : 4 * 360) + destinationOffset;
      restingRotationRef.current = landingRotation;
      const animationDuration = shouldReduceMotion
        ? theme.animation.reducedMotionDuration
        : (duration ?? theme.animation.coinFlipDuration);
      return new Promise<typeof result>((resolve, reject) => {
        pendingRef.current = { operation, reject, resolve, result };
        rotation.set(startingRotation);
        motionProgress.set(0);
        motionProgress.set(withTiming(1, { duration: animationDuration, easing }));
        rotation.set(
          withTiming(
            destinationRotation,
            {
              duration: animationDuration,
              easing,
            },
            (finished) => {
              if (!finished) return;
              runOnJS(finishAnimation)(operation);
            },
          ),
        );
      });
    },
    [
      coinFaces,
      controller,
      duration,
      easing,
      finishAnimation,
      motionProgress,
      rotation,
      shouldReduceMotion,
      theme.animation,
    ],
  );
  const flip = useCallback(
    async (selection?: Parameters<typeof controller.play>[0]) => {
      if (pendingRef.current !== undefined)
        throw new GameStateError('Coin Flip is already animating.');
      return animate(await controller.play(selection));
    },
    [animate, controller],
  );
  const reset = useCallback(() => {
    operationRef.current += 1;
    cancelAnimation(motionProgress);
    cancelAnimation(rotation);
    pendingRef.current?.reject(
      new AnimationError('Coin Flip was reset before its animation completed.'),
    );
    pendingRef.current = undefined;
    motionProgress.set(0);
    rotation.set(0);
    restingRotationRef.current = 0;
    setFaceId(coinFaces[0]?.id ?? 'heads');
    setFlipping(false);
    controller.reset();
  }, [coinFaces, controller, motionProgress, rotation]);
  useImperativeHandle(
    ref,
    () => ({ flip: () => flip(), flipTo: (selection) => flip(selection), reset }),
    [flip, reset],
  );
  useEffect(
    () => () => {
      mountedRef.current = false;
      operationRef.current += 1;
      pendingRef.current?.reject(
        new AnimationError('Coin Flip unmounted before its animation completed.'),
      );
      pendingRef.current = undefined;
    },
    [],
  );
  const busy =
    flipping || controller.status === 'playing' || controller.status === 'requesting-result';
  const disabled = props.disabled === true || busy;
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[{ alignItems: 'center', gap: theme.spacing.md }, style]}
    >
      <View
        pointerEvents="none"
        style={{
          alignItems: 'center',
          height: size + 48,
          justifyContent: 'center',
          width: size + 48,
          zIndex: 0,
        }}
      >
        <Animated.View style={[{ height: size, width: size }, animatedStyle]}>
          {coinFaces.map((face, index) => {
            const active = face.id === faceId;
            const backgroundColor = index === 0 ? theme.colors.coinFront : theme.colors.coinBack;
            const contentColor = index === 0 ? theme.colors.dicePip : theme.colors.onPrimary;
            const label = face.label ?? face.id;
            return (
              <Animated.View
                accessibilityElementsHidden={!active}
                importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
                key={face.id}
                style={[
                  {
                    backfaceVisibility: 'hidden',
                    height: size,
                    left: 0,
                    opacity: !flipping && !active ? 0 : 1,
                    position: 'absolute',
                    top: 0,
                    width: size,
                  },
                  index === 0 ? frontFaceStyle : backFaceStyle,
                ]}
              >
                {renderFace?.({ active, face, flipping, theme }) ?? (
                  <View
                    accessibilityLabel={`Coin face: ${label}`}
                    style={{
                      alignItems: 'center',
                      backgroundColor,
                      borderColor: faceStyle === 'embossed' ? contentColor : theme.colors.border,
                      borderRadius: size / 2,
                      borderWidth: faceStyle === 'embossed' ? Math.max(4, size * 0.045) : 3,
                      boxShadow:
                        faceStyle === 'embossed'
                          ? '0 12px 24px rgba(37, 25, 77, 0.28), inset 0 0 0 5px rgba(255, 255, 255, 0.28)'
                          : undefined,
                      height: size,
                      justifyContent: 'center',
                      width: size,
                    }}
                  >
                    {faceStyle === 'embossed' ? (
                      <View
                        style={{
                          alignItems: 'center',
                          borderColor: contentColor,
                          borderRadius: size / 2,
                          borderWidth: Math.max(2, size * 0.018),
                          height: size * 0.76,
                          justifyContent: 'center',
                          width: size * 0.76,
                        }}
                        testID="jackpotkit-coin-rim"
                      >
                        <Text
                          selectable
                          style={{
                            color: contentColor,
                            fontFamily: theme.typography.fontFamily,
                            fontSize: size * 0.3,
                            fontWeight: '900',
                            lineHeight: size * 0.34,
                          }}
                        >
                          {label.slice(0, 1).toUpperCase()}
                        </Text>
                        <Text
                          selectable
                          style={{
                            color: contentColor,
                            fontFamily: theme.typography.fontFamily,
                            fontSize: Math.max(10, size * 0.085),
                            fontWeight: '900',
                            letterSpacing: 1.2,
                            opacity: flipping ? 0 : 1,
                            textTransform: 'uppercase',
                          }}
                        >
                          {label}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        selectable
                        style={{
                          color: contentColor,
                          fontFamily: theme.typography.fontFamily,
                          fontSize: theme.typography.titleSize,
                          fontWeight: '900',
                          opacity: flipping ? 0 : 1,
                        }}
                      >
                        {label}
                      </Text>
                    )}
                  </View>
                )}
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
      <Pressable
        accessibilityLabel={busy ? 'Coin flipping' : 'Flip coin'}
        accessibilityRole="button"
        accessibilityState={{ busy, disabled }}
        disabled={disabled}
        onPress={() => void flip().catch(() => undefined)}
        style={({ pressed }) => ({
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radii.full,
          opacity: disabled ? 0.65 : pressed ? 0.8 : 1,
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.sm + 4,
          zIndex: 1,
        })}
      >
        <Text
          selectable
          style={{
            color: theme.colors.onPrimary,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.labelSize,
            fontWeight: '900',
          }}
        >
          {busy ? 'Flipping…' : 'Flip coin'}
        </Text>
      </Pressable>
      {controller.result !== undefined && controller.status === 'completed' ? (
        <Text
          accessibilityLiveRegion="polite"
          selectable
          style={{
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.titleSize,
            fontWeight: '800',
          }}
        >
          Result: {controller.result.face.label ?? controller.result.face.id}
        </Text>
      ) : null}
    </View>
  );
}

export const CoinFlip = forwardRef(CoinFlipInner) as <TValue = unknown, TRequest = void>(
  props: CoinFlipProps<TValue, TRequest> & React.RefAttributes<CoinFlipRef<TValue>>,
) => React.ReactElement;
