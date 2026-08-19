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
  type SharedValue,
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

interface GiftBoxFaceProps {
  readonly accentColor: string;
  readonly boxColor: string;
  readonly boxWidth: number;
  readonly disabled: boolean;
  readonly label: string;
  readonly progress: SharedValue<number>;
  readonly selected: boolean;
  readonly textColor: string;
  readonly winning: boolean;
}

function GiftBoxFace({
  accentColor,
  boxColor,
  boxWidth,
  disabled,
  label,
  progress,
  selected,
  textColor,
  winning,
}: GiftBoxFaceProps) {
  const lidStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: winning ? progress.value * -8 : 0 },
      { translateY: winning ? progress.value * -23 : 0 },
      { rotateZ: `${winning ? progress.value * -13 : 0}deg` },
    ],
  }));
  const rewardStyle = useAnimatedStyle(() => ({
    opacity: winning ? progress.value : 0,
    transform: [
      { translateY: winning ? 10 - progress.value * 50 : 10 },
      { scale: winning ? 0.45 + progress.value * 0.63 : 0.45 },
      { rotateZ: `${winning ? progress.value * 8 : 0}deg` },
    ],
  }));
  const giftWidth = Math.min(82, Math.max(68, boxWidth - 28));
  const bodyWidth = giftWidth - 16;
  const ribbonWidth = 12;

  return (
    <View
      style={{
        alignItems: 'center',
        minHeight: 140,
        opacity: disabled ? 0.5 : 1,
        paddingTop: 6,
        width: boxWidth,
      }}
      testID="jackpotkit-lucky-gift"
    >
      <View
        style={{
          height: 92,
          transform: selected ? [{ translateY: -3 }] : undefined,
          width: giftWidth,
        }}
      >
        <Animated.Text
          selectable={false}
          style={[
            {
              color: accentColor,
              fontSize: 30,
              fontWeight: '900',
              left: giftWidth / 2 - 11,
              position: 'absolute',
              top: 21,
              zIndex: 1,
            },
            rewardStyle,
          ]}
          testID={`jackpotkit-lucky-gift-reward-${label}`}
        >
          ★
        </Animated.Text>
        <View
          style={{
            backgroundColor: boxColor,
            borderColor: 'rgba(255,255,255,0.34)',
            borderCurve: 'continuous',
            borderRadius: 7,
            borderWidth: 1,
            bottom: 2,
            boxShadow: 'inset -8px -8px 14px rgba(23,20,43,0.2), 0 10px 14px rgba(37,25,77,0.2)',
            height: 52,
            left: 8,
            overflow: 'hidden',
            position: 'absolute',
            width: bodyWidth,
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(23,20,43,0.34)',
              height: 9,
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          />
          <View
            style={{
              backgroundColor: accentColor,
              bottom: 0,
              left: bodyWidth / 2 - ribbonWidth / 2,
              position: 'absolute',
              top: 0,
              width: ribbonWidth,
            }}
          />
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.13)',
              height: 16,
              left: -8,
              position: 'absolute',
              top: 7,
              transform: [{ rotateZ: '-18deg' }],
              width: bodyWidth + 20,
            }}
          />
        </View>
        <Animated.View
          style={[
            {
              backgroundColor: boxColor,
              borderColor: 'rgba(255,255,255,0.45)',
              borderCurve: 'continuous',
              borderRadius: 7,
              borderWidth: 1,
              boxShadow: '0 5px 8px rgba(37,25,77,0.25)',
              height: 24,
              left: 2,
              position: 'absolute',
              top: 25,
              width: giftWidth - 4,
              zIndex: 3,
            },
            lidStyle,
          ]}
          testID={`jackpotkit-lucky-gift-lid-${label}`}
        >
          <View
            style={{
              backgroundColor: accentColor,
              bottom: 0,
              left: (giftWidth - 4) / 2 - ribbonWidth / 2,
              position: 'absolute',
              top: 0,
              width: ribbonWidth,
            }}
          />
          <View
            style={{
              backgroundColor: accentColor,
              borderBottomLeftRadius: 12,
              borderTopLeftRadius: 16,
              height: 18,
              left: giftWidth / 2 - 26,
              position: 'absolute',
              top: -14,
              transform: [{ rotateZ: '28deg' }],
              width: 19,
            }}
          />
          <View
            style={{
              backgroundColor: accentColor,
              borderBottomRightRadius: 12,
              borderTopRightRadius: 16,
              height: 18,
              left: giftWidth / 2 + 3,
              position: 'absolute',
              top: -14,
              transform: [{ rotateZ: '-28deg' }],
              width: 19,
            }}
          />
          <View
            style={{
              backgroundColor: accentColor,
              borderColor: 'rgba(255,255,255,0.45)',
              borderRadius: 7,
              borderWidth: 2,
              height: 14,
              left: giftWidth / 2 - 9,
              position: 'absolute',
              top: -9,
              width: 14,
            }}
          />
        </Animated.View>
      </View>
      <Text
        numberOfLines={2}
        selectable
        style={{
          backgroundColor: selected ? accentColor : 'transparent',
          borderRadius: 999,
          color: selected ? '#17142B' : textColor,
          fontSize: 12,
          fontWeight: '900',
          maxWidth: boxWidth - 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          textAlign: 'center',
        }}
      >
        {winning ? '★ ' : ''}
        {label}
        {disabled ? ' · unavailable' : ''}
      </Text>
    </View>
  );
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
    faceStyle = 'tiles',
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
  const giftColors = [
    theme.colors.primary,
    theme.colors.coinFront,
    theme.colors.wheelPalette[3] ?? theme.colors.scratchAccent,
    theme.colors.coinBack,
  ];
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[{ alignItems: 'center', gap: theme.spacing.md, width: componentWidth }, style]}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {boxes.map((box, index) => {
          const selected = controller.selectedBoxId === box.id;
          const winning = displayResult?.winningBox.id === box.id;
          const giftFace = faceStyle === 'gift-boxes' && renderBox === undefined;
          const content =
            renderBox?.({
              box,
              revealed: displayResult !== undefined,
              selected,
              theme,
              winning,
            }) ??
            (giftFace ? (
              <GiftBoxFace
                accentColor={theme.colors.scratchAccent}
                boxColor={giftColors[index % giftColors.length] ?? theme.colors.primary}
                boxWidth={boxWidth}
                disabled={box.disabled === true}
                label={box.label ?? box.id}
                progress={progress}
                selected={selected}
                textColor={theme.colors.text}
                winning={winning}
              />
            ) : (
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
            ));
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
