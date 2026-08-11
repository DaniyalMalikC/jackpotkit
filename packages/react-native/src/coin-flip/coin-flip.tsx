import {
  AnimationError,
  DEFAULT_COIN_FACES,
  GameStateError,
  type CoinFace,
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
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useJackpotKitTheme } from '../theme-provider';
import type { CoinFlipProps, CoinFlipRef } from './types';
import { useCoinFlipController } from './use-coin-flip';

function CoinFlipInner<TValue = unknown, TRequest = void>(
  props: CoinFlipProps<TValue, TRequest>,
  ref: React.ForwardedRef<CoinFlipRef<TValue>>,
) {
  const {
    accessibilityLabel = 'Coin Flip',
    duration,
    easing = Easing.out(Easing.cubic),
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
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion === true || systemReducedMotion;
  const operationRef = useRef(0);
  const mountedRef = useRef(true);
  const pendingRef = useRef<{ reject(error: unknown): void } | undefined>(undefined);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${rotation.value}deg` }],
  }));
  const animate = useCallback(
    (result: Awaited<ReturnType<typeof controller.play>>) => {
      const operation = ++operationRef.current;
      controller.startAnimation(result);
      setFlipping(true);
      setFaceId(result.faceId);
      return new Promise<typeof result>((resolve, reject) => {
        pendingRef.current = { reject };
        rotation.set(0);
        rotation.set(
          withTiming(
            1_080,
            {
              duration: shouldReduceMotion
                ? theme.animation.reducedMotionDuration
                : (duration ?? theme.animation.coinFlipDuration),
              easing,
            },
            (finished) => {
              if (!finished) return;
              runOnJS(() => {
                if (!mountedRef.current || operation !== operationRef.current) return;
                pendingRef.current = undefined;
                setFlipping(false);
                controller.reveal(result);
                controller.complete(result);
                AccessibilityInfo.announceForAccessibility(
                  `Coin result: ${result.face.label ?? result.face.id}.`,
                );
                resolve(result);
              })();
            },
          ),
        );
      });
    },
    [controller, duration, easing, rotation, shouldReduceMotion, theme.animation],
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
    cancelAnimation(rotation);
    pendingRef.current?.reject(
      new AnimationError('Coin Flip was reset before its animation completed.'),
    );
    pendingRef.current = undefined;
    rotation.set(0);
    setFaceId(coinFaces[0]?.id ?? 'heads');
    setFlipping(false);
    controller.reset();
  }, [coinFaces, controller, rotation]);
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
  const currentFace = coinFaces.find((face) => face.id === faceId) ?? coinFaces[0];
  const busy =
    flipping || controller.status === 'playing' || controller.status === 'requesting-result';
  const disabled = props.disabled === true || busy;
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[{ alignItems: 'center', gap: theme.spacing.md }, style]}
    >
      <Animated.View style={animatedStyle}>
        {currentFace !== undefined &&
          (renderFace?.({ active: true, face: currentFace, flipping, theme }) ?? (
            <View
              accessibilityLabel={`Coin face: ${currentFace.label ?? currentFace.id}`}
              style={{
                alignItems: 'center',
                backgroundColor:
                  currentFace.id === coinFaces[0]?.id
                    ? theme.colors.coinFront
                    : theme.colors.coinBack,
                borderColor: theme.colors.border,
                borderRadius: size / 2,
                borderWidth: 3,
                height: size,
                justifyContent: 'center',
                width: size,
              }}
            >
              <Text
                selectable
                style={{
                  color:
                    currentFace.id === coinFaces[0]?.id
                      ? theme.colors.dicePip
                      : theme.colors.onPrimary,
                  fontFamily: theme.typography.fontFamily,
                  fontSize: theme.typography.titleSize,
                  fontWeight: '900',
                }}
              >
                {currentFace.label ?? currentFace.id}
              </Text>
            </View>
          ))}
      </Animated.View>
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
