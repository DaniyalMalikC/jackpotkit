import { AnimationError, GameStateError, type LuckyBoxResult } from '@jackpotkit/core';
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

import { useJackpotKitTheme } from '../theme-provider';
import type { LuckyBoxProps, LuckyBoxRef } from './types';
import { useLuckyBoxController } from './use-lucky-box';

interface PendingLuckyBoxAnimation<TReward> {
  readonly operation: number;
  readonly reject: (error: unknown) => void;
  readonly resolve: (result: LuckyBoxResult<TReward>) => void;
  readonly result: LuckyBoxResult<TReward>;
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
    easing = Easing.out(Easing.cubic),
    reduceMotion,
    renderBox,
    style,
    theme: themeOverride,
    width,
  } = props;
  if (!Number.isInteger(columns) || columns < 1)
    throw new RangeError('Lucky Box columns must be a positive integer.');
  const providerTheme = useJackpotKitTheme();
  const theme = useMemo(
    () => createJackpotTheme(themeOverride, providerTheme),
    [providerTheme, themeOverride],
  );
  const controller = useLuckyBoxController(props, false);
  const { width: windowWidth } = useWindowDimensions();
  const componentWidth = width ?? Math.min(520, Math.max(240, windowWidth - 48));
  const gap = theme.spacing.sm;
  const boxWidth = (componentWidth - gap * (columns - 1)) / columns;
  const progress = useSharedValue(0);
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion === true || systemReducedMotion;
  const operationRef = useRef(0);
  const mountedRef = useRef(true);
  const pendingRef = useRef<PendingLuckyBoxAnimation<TReward> | undefined>(undefined);
  const [revealing, setRevealing] = useState(false);
  const [displayResult, setDisplayResult] = useState<Awaited<ReturnType<typeof controller.play>>>();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.08 }, { rotateZ: `${progress.value * 3}deg` }],
  }));
  const finishAnimation = useCallback(
    (operation: number) => {
      const pending = pendingRef.current;
      if (pending === undefined || pending.operation !== operation || !mountedRef.current) {
        return;
      }

      pendingRef.current = undefined;
      setRevealing(false);
      controller.reveal(pending.result);
      controller.complete(pending.result);
      AccessibilityInfo.announceForAccessibility(
        pending.result.won
          ? `You won ${pending.result.winningBox.label ?? pending.result.winningBox.id}.`
          : `Not a winner. Winning box: ${pending.result.winningBox.label ?? pending.result.winningBox.id}.`,
      );
      pending.resolve(pending.result);
    },
    [controller],
  );

  const animate = useCallback(
    (result: LuckyBoxResult<TReward>) => {
      const operation = ++operationRef.current;
      controller.startAnimation(result);
      setDisplayResult(result);
      setRevealing(true);
      return new Promise<typeof result>((resolve, reject) => {
        pendingRef.current = { operation, reject, resolve, result };
        progress.set(0);
        progress.set(
          withTiming(
            1,
            {
              duration: shouldReduceMotion
                ? theme.animation.reducedMotionDuration
                : (duration ?? theme.animation.luckyBoxRevealDuration),
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
    [controller, duration, easing, finishAnimation, progress, shouldReduceMotion, theme.animation],
  );
  const reveal = useCallback(
    async (selection?: Parameters<typeof controller.play>[0]) => {
      if (pendingRef.current !== undefined)
        throw new GameStateError('Lucky Box is already revealing.');
      return animate(await controller.play(selection));
    },
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
    operationRef.current += 1;
    cancelAnimation(progress);
    pendingRef.current?.reject(
      new AnimationError('Lucky Box was reset before its animation completed.'),
    );
    pendingRef.current = undefined;
    progress.set(0);
    setDisplayResult(undefined);
    setRevealing(false);
    controller.reset();
  }, [controller, progress]);
  useImperativeHandle(
    ref,
    () => ({
      pick,
      reset,
      reveal: () => reveal(),
      revealTo: (selection) => reveal(selection),
      select: controller.select,
    }),
    [controller.select, pick, reset, reveal],
  );
  useEffect(
    () => () => {
      mountedRef.current = false;
      operationRef.current += 1;
      pendingRef.current?.reject(
        new AnimationError('Lucky Box unmounted before its animation completed.'),
      );
      pendingRef.current = undefined;
    },
    [],
  );
  const busy = revealing || controller.status === 'requesting-result';
  const disabled = props.disabled === true || busy || displayResult !== undefined;
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[{ alignItems: 'center', gap: theme.spacing.md, width: componentWidth }, style]}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {boxes.map((box) => {
          const selected = controller.selectedBoxId === box.id;
          const winning = displayResult?.winningBox.id === box.id;
          const content = renderBox?.({
            box,
            revealed: displayResult !== undefined,
            selected,
            theme,
            winning,
          }) ?? (
            <View
              style={{
                alignItems: 'center',
                backgroundColor: selected ? theme.colors.luckyBoxSelected : theme.colors.luckyBox,
                borderColor: winning ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.radii.md,
                borderWidth: winning ? 3 : 2,
                justifyContent: 'center',
                minHeight: 88,
                padding: theme.spacing.sm,
                width: boxWidth,
              }}
            >
              <Text
                selectable
                style={{
                  color: selected ? theme.colors.dicePip : theme.colors.text,
                  fontFamily: theme.typography.fontFamily,
                  fontSize: theme.typography.labelSize,
                  fontWeight: '900',
                  textAlign: 'center',
                }}
              >
                {winning ? '★ ' : ''}
                {box.label ?? box.id}
                {box.disabled === true ? ' · unavailable' : ''}
              </Text>
            </View>
          );
          return (
            <Pressable
              accessibilityLabel={`${box.label ?? box.id}${selected ? ', selected' : ''}${winning ? ', winning box' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: disabled || box.disabled === true, selected }}
              disabled={disabled || box.disabled === true}
              key={box.id}
              onPress={() => controller.select(box.id)}
            >
              <Animated.View style={winning ? animatedStyle : undefined}>{content}</Animated.View>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityLabel={busy ? 'Revealing Lucky Box' : 'Reveal Lucky Box'}
        accessibilityRole="button"
        accessibilityState={{ busy, disabled: disabled || controller.selectedBoxId === undefined }}
        disabled={disabled || controller.selectedBoxId === undefined}
        onPress={() => void reveal().catch(() => undefined)}
        style={({ pressed }) => ({
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radii.full,
          opacity: disabled || controller.selectedBoxId === undefined ? 0.65 : pressed ? 0.8 : 1,
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
          {busy ? 'Revealing…' : 'Reveal selection'}
        </Text>
      </Pressable>
      {displayResult !== undefined && controller.status === 'completed' ? (
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
          {displayResult.won
            ? 'You found the winning box!'
            : `Winning box: ${displayResult.winningBox.label ?? displayResult.winningBox.id}`}
        </Text>
      ) : null}
    </View>
  );
}

export const LuckyBox = forwardRef(LuckyBoxInner) as <TReward = unknown, TRequest = void>(
  props: LuckyBoxProps<TReward, TRequest> & React.RefAttributes<LuckyBoxRef<TReward>>,
) => React.ReactElement;
