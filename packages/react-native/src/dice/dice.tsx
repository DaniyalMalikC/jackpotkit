import {
  AnimationError,
  GameStateError,
  createDiceDefinitions,
  type DiceResult,
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
import { AccessibilityInfo, Pressable, Text, useWindowDimensions, View } from 'react-native';
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
import type { DiceProps, DiceRef } from './types';
import { useDiceController } from './use-dice';
import { assertDiceComponentConfiguration } from './validation';

interface PendingDiceAnimation {
  readonly operation: number;
  readonly reject: (error: unknown) => void;
  readonly resolve: (result: DiceResult) => void;
  readonly result: DiceResult;
}

const PIP_CELLS: Readonly<Record<number, readonly number[]>> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DiceInner<TRequest = void>(props: DiceProps<TRequest>, ref: React.ForwardedRef<DiceRef>) {
  const {
    accessibilityLabel = 'Dice',
    count,
    dice,
    duration,
    easing = Easing.out(Easing.cubic),
    faceStyle = 'numbers',
    reduceMotion,
    renderDie,
    sides,
    style,
    theme: themeOverride,
    width,
  } = props;
  assertDiceComponentConfiguration(props);
  const providerTheme = useJackpotKitTheme();
  const theme = useMemo(
    () => createJackpotTheme(themeOverride, providerTheme),
    [providerTheme, themeOverride],
  );
  const controller = useDiceController(props, false);
  const definitions = useMemo(
    () => dice ?? createDiceDefinitions(count ?? 1, sides ?? 6),
    [count, dice, sides],
  );
  const { width: windowWidth } = useWindowDimensions();
  const componentWidth = width ?? Math.min(460, Math.max(240, windowWidth - 48));
  const dieSize = Math.max(
    52,
    Math.min(96, (componentWidth - theme.spacing.md * 2) / definitions.length),
  );
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion === true || systemReducedMotion;
  const rollProgress = useSharedValue(0);
  const operationRef = useRef(0);
  const mountedRef = useRef(true);
  const pendingRef = useRef<PendingDiceAnimation | undefined>(undefined);
  const [rolling, setRolling] = useState(false);
  const [values, setValues] = useState<readonly number[]>(definitions.map(() => 1));
  const animatedStyle = useAnimatedStyle(() => {
    const progress = rollProgress.value;
    return {
      transform: [
        { translateY: interpolate(progress, [0, 0.34, 0.78, 1], [0, -14, 3, 0]) },
        { rotateZ: `${progress * 720}deg` },
        { scale: interpolate(progress, [0, 0.34, 0.78, 1], [1, 0.94, 1.04, 1]) },
      ],
    };
  });

  const finishAnimation = useCallback(
    (operation: number) => {
      const pending = pendingRef.current;
      if (pending === undefined || pending.operation !== operation || !mountedRef.current) {
        return;
      }

      pendingRef.current = undefined;
      setRolling(false);
      controller.reveal(pending.result);
      controller.complete(pending.result);
      AccessibilityInfo.announceForAccessibility(
        `Dice result ${pending.result.values.join(', ')}. Total ${pending.result.total}.`,
      );
      pending.resolve(pending.result);
    },
    [controller],
  );

  const animate = useCallback(
    (result: DiceResult) => {
      const operation = ++operationRef.current;
      controller.startAnimation(result);
      setRolling(true);
      setValues(result.values);
      const animationDuration = shouldReduceMotion
        ? theme.animation.reducedMotionDuration
        : (duration ?? theme.animation.diceRollDuration);

      return new Promise<typeof result>((resolve, reject) => {
        pendingRef.current = { operation, reject, resolve, result };
        rollProgress.set(0);
        rollProgress.set(
          withTiming(1, { duration: animationDuration, easing }, (finished) => {
            if (!finished) return;
            runOnJS(finishAnimation)(operation);
          }),
        );
      });
    },
    [
      controller,
      duration,
      easing,
      finishAnimation,
      rollProgress,
      shouldReduceMotion,
      theme.animation,
    ],
  );
  const roll = useCallback(
    async (selection?: Parameters<typeof controller.play>[0]) => {
      if (pendingRef.current !== undefined) throw new GameStateError('Dice is already rolling.');
      return animate(await controller.play(selection));
    },
    [animate, controller],
  );
  const reset = useCallback(() => {
    operationRef.current += 1;
    cancelAnimation(rollProgress);
    pendingRef.current?.reject(
      new AnimationError('Dice was reset before its animation completed.'),
    );
    pendingRef.current = undefined;
    rollProgress.set(0);
    setRolling(false);
    setValues(definitions.map(() => 1));
    controller.reset();
  }, [controller, definitions, rollProgress]);

  useImperativeHandle(
    ref,
    () => ({ reset, roll: () => roll(), rollTo: (selection) => roll(selection) }),
    [reset, roll],
  );
  useEffect(
    () => () => {
      mountedRef.current = false;
      operationRef.current += 1;
      pendingRef.current?.reject(
        new AnimationError('Dice unmounted before its animation completed.'),
      );
      pendingRef.current = undefined;
    },
    [],
  );

  const busy =
    rolling || controller.status === 'playing' || controller.status === 'requesting-result';
  const disabled = props.disabled === true || busy;
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[{ alignItems: 'center', gap: theme.spacing.md, width: componentWidth }, style]}
    >
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
          justifyContent: 'center',
        }}
      >
        {definitions.map((die, index) => {
          const value = values[index] ?? 1;
          return (
            <Animated.View key={die.id} style={animatedStyle}>
              {renderDie?.({ die, index, rolling, theme, value }) ?? (
                <View
                  accessibilityLabel={`${die.label ?? `Die ${index + 1}`}: ${value}`}
                  style={{
                    alignItems: 'center',
                    backgroundColor: theme.colors.diceFace,
                    borderColor: theme.colors.border,
                    borderRadius: faceStyle === 'pips' ? dieSize * 0.2 : theme.radii.md,
                    borderWidth: 2,
                    height: dieSize,
                    justifyContent: 'center',
                    width: dieSize,
                  }}
                >
                  {faceStyle === 'pips' && die.sides === 6 ? (
                    <View
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        height: '68%',
                        width: '68%',
                      }}
                    >
                      {Array.from({ length: 9 }, (_, cell) => {
                        const visible = PIP_CELLS[value]?.includes(cell) === true;
                        return (
                          <View
                            key={cell}
                            style={{
                              alignItems: 'center',
                              height: '33.333%',
                              justifyContent: 'center',
                              width: '33.333%',
                            }}
                          >
                            {visible ? (
                              <View
                                style={{
                                  backgroundColor: theme.colors.dicePip,
                                  borderRadius: dieSize,
                                  height: dieSize * 0.13,
                                  width: dieSize * 0.13,
                                }}
                                testID="jackpotkit-die-pip"
                              />
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text
                      selectable
                      style={{
                        color: theme.colors.dicePip,
                        fontFamily: theme.typography.fontFamily,
                        fontSize: theme.typography.titleSize * 1.5,
                        fontWeight: '900',
                      }}
                    >
                      {value}
                    </Text>
                  )}
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>
      <Pressable
        accessibilityLabel={busy ? 'Dice rolling' : 'Roll dice'}
        accessibilityRole="button"
        accessibilityState={{ busy, disabled }}
        disabled={disabled}
        onPress={() => void roll().catch(() => undefined)}
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
          {busy ? 'Rolling…' : 'Roll dice'}
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
          Total: {controller.result.total}
        </Text>
      ) : null}
    </View>
  );
}

export const Dice = forwardRef(DiceInner);
