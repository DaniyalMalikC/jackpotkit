import {
  AnimationError,
  GameStateError,
  type SlotMachineResult,
  type SlotMachineSelection,
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
  type ReactElement,
  type RefAttributes,
} from 'react';
import { AccessibilityInfo, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Easing, useReducedMotion } from 'react-native-reanimated';

import { useJackpotKitTheme } from '../theme-provider';
import { SlotReel } from './slot-reel';
import type { SlotMachineProps, SlotMachineRef } from './types';
import { useSlotMachineController } from './use-slot-machine';
import { assertSlotMachineComponentConfiguration } from './validation';

interface PendingAnimation<TValue, TEvaluation> {
  readonly operation: number;
  readonly result: SlotMachineResult<TValue, TEvaluation>;
  readonly resolve: (result: SlotMachineResult<TValue, TEvaluation>) => void;
  readonly reject: (error: unknown) => void;
  readonly stoppedReels: Set<number>;
}

function SlotMachineInner<TValue = unknown, TEvaluation = unknown, TRequest = void>(
  props: SlotMachineProps<TValue, TEvaluation, TRequest>,
  ref: React.ForwardedRef<SlotMachineRef<TValue, TEvaluation>>,
) {
  const {
    accessibilityLabel,
    accessibilityLabels = {},
    duration,
    easing = Easing.out(Easing.cubic),
    reduceMotion,
    reelCount,
    reelDelay,
    renderSymbol,
    status: controlledStatus,
    style,
    symbolHeight = 72,
    symbols,
    theme: themeOverride,
    width,
  } = props;
  const providerTheme = useJackpotKitTheme();
  const theme = useMemo(
    () => createJackpotTheme(themeOverride, providerTheme),
    [providerTheme, themeOverride],
  );
  assertSlotMachineComponentConfiguration(props, theme);
  const controller = useSlotMachineController(props, false);
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion === true || systemReducedMotion;
  const { width: windowWidth } = useWindowDimensions();
  const machineWidth = width ?? Math.min(460, Math.max(240, windowWidth - 48));
  const reelGap = Math.min(8, machineWidth * 0.02);
  const reelWidth = (machineWidth - theme.spacing.md * 2 - reelGap * (reelCount - 1)) / reelCount;
  const rowCount = props.rowCount ?? 3;
  const operationRef = useRef(0);
  const pendingRef = useRef<PendingAnimation<TValue, TEvaluation> | undefined>(undefined);
  const mountedRef = useRef(true);
  const [displayResult, setDisplayResult] = useState<SlotMachineResult<TValue, TEvaluation>>();
  const [animationOperation, setAnimationOperation] = useState(0);
  const status = controlledStatus ?? controller.status;
  const isBusy =
    status === 'playing' ||
    status === 'requesting-result' ||
    status === 'revealing' ||
    controller.status === 'playing' ||
    controller.status === 'requesting-result' ||
    controller.status === 'revealing';
  const isDisabled = props.disabled === true || status === 'disabled' || isBusy;
  const labels = useMemo(
    () => ({
      machine: accessibilityLabels.machine ?? accessibilityLabel ?? 'Slot Machine',
      result:
        accessibilityLabels.result ??
        ((result: SlotMachineResult<TValue, TEvaluation>) =>
          result.winningPaylines.length > 0
            ? `${result.winningPaylines.length} winning payline${result.winningPaylines.length === 1 ? '' : 's'}.`
            : 'No matching paylines.'),
      spin: accessibilityLabels.spin ?? 'Spin reels',
      spinning: accessibilityLabels.spinning ?? 'Reels spinning',
    }),
    [accessibilityLabel, accessibilityLabels],
  );
  const initialReels = useMemo(
    () =>
      Array.from({ length: reelCount }, (_, reelIndex) =>
        Array.from(
          { length: rowCount },
          (_, rowIndex) =>
            symbols[(reelIndex + rowIndex) % symbols.length] as (typeof symbols)[number],
        ),
      ),
    [reelCount, rowCount, symbols],
  );
  const reels = displayResult?.reels ?? initialReels;
  const winningCells = useMemo(() => {
    const cells = new Set<string>();
    if (status !== 'completed') return cells;

    displayResult?.winningPaylines.forEach((payline) => {
      payline.rows.forEach((rowIndex, reelIndex) => cells.add(`${reelIndex}:${rowIndex}`));
    });
    return cells;
  }, [displayResult, status]);

  const finishAnimation = useCallback(() => {
    const pending = pendingRef.current;
    if (pending === undefined || !mountedRef.current) return;
    pendingRef.current = undefined;
    setAnimationOperation(0);
    controller.reveal(pending.result);
    controller.complete(pending.result);
    AccessibilityInfo.announceForAccessibility(labels.result(pending.result));
    pending.resolve(pending.result);
  }, [controller, labels]);

  const handleReelStop = useCallback(
    (reelIndex: number, operation: number) => {
      const pending = pendingRef.current;
      if (
        pending === undefined ||
        pending.operation !== operation ||
        pending.stoppedReels.has(reelIndex)
      ) {
        return;
      }
      pending.stoppedReels.add(reelIndex);
      controller.reelStop(reelIndex, pending.result);
      if (pending.stoppedReels.size === reelCount) finishAnimation();
    },
    [controller, finishAnimation, reelCount],
  );

  const animateResult = useCallback(
    (result: SlotMachineResult<TValue, TEvaluation>) => {
      const operation = ++operationRef.current;
      controller.startAnimation(result);
      setDisplayResult(result);
      setAnimationOperation(operation);

      return new Promise<SlotMachineResult<TValue, TEvaluation>>((resolve, reject) => {
        pendingRef.current = { operation, reject, resolve, result, stoppedReels: new Set() };
      });
    },
    [controller],
  );

  const play = useCallback(
    async (selection?: SlotMachineSelection) => {
      if (pendingRef.current !== undefined) {
        throw new GameStateError('The Slot Machine reels are already animating.');
      }

      const result =
        selection === undefined ? await controller.spin() : await controller.spinTo(selection);
      return animateResult(result);
    },
    [animateResult, controller],
  );

  const reset = useCallback(() => {
    operationRef.current += 1;
    pendingRef.current?.reject(
      new AnimationError('The Slot Machine animation was reset before completion.'),
    );
    pendingRef.current = undefined;
    setAnimationOperation(0);
    setDisplayResult(undefined);
    controller.reset();
  }, [controller]);

  useImperativeHandle(
    ref,
    () => ({ reset, spin: () => play(), spinTo: (selection) => play(selection) }),
    [play, reset],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      operationRef.current += 1;
      pendingRef.current?.reject(
        new AnimationError('The Slot Machine unmounted before its animation completed.'),
      );
      pendingRef.current = undefined;
    };
  }, []);

  return (
    <View
      accessibilityLabel={labels.machine}
      style={[{ alignItems: 'center', gap: theme.spacing.md, width: machineWidth }, style]}
    >
      <View
        style={{
          backgroundColor: theme.colors.slotBackground,
          borderColor: theme.colors.border,
          borderCurve: 'continuous',
          borderRadius: theme.radii.lg,
          borderWidth: 2,
          flexDirection: 'row',
          gap: reelGap,
          overflow: 'hidden',
          padding: theme.spacing.md,
          width: machineWidth,
        }}
      >
        {reels.map((destination, reelIndex) => (
          <SlotReel
            active={animationOperation > 0}
            destination={destination}
            duration={
              shouldReduceMotion
                ? theme.animation.reducedMotionDuration
                : (duration ?? theme.animation.slotDuration)
            }
            easing={easing}
            key={reelIndex}
            onStop={handleReelStop}
            operation={animationOperation}
            reelDelay={shouldReduceMotion ? 0 : (reelDelay ?? theme.animation.slotReelDelay)}
            reelIndex={reelIndex}
            {...(renderSymbol === undefined ? {} : { renderSymbol })}
            rowCount={rowCount}
            symbolHeight={symbolHeight}
            symbols={symbols}
            theme={theme}
            width={reelWidth}
            winningCells={winningCells}
          />
        ))}
      </View>

      <Pressable
        accessibilityLabel={isBusy ? labels.spinning : labels.spin}
        accessibilityRole="button"
        accessibilityState={{ busy: isBusy, disabled: isDisabled }}
        disabled={isDisabled}
        onPress={() => void play().catch(() => undefined)}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: theme.colors.primary,
          borderCurve: 'continuous',
          borderRadius: theme.radii.full,
          opacity: isDisabled ? 0.65 : pressed ? 0.8 : 1,
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
          {isBusy ? labels.spinning : labels.spin}
        </Text>
      </Pressable>

      {displayResult !== undefined && status === 'completed' ? (
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
          {labels.result(displayResult)}
        </Text>
      ) : null}
    </View>
  );
}

export const SlotMachine = forwardRef(SlotMachineInner) as <
  TValue = unknown,
  TEvaluation = unknown,
  TRequest = void,
>(
  props: SlotMachineProps<TValue, TEvaluation, TRequest> &
    RefAttributes<SlotMachineRef<TValue, TEvaluation>>,
) => ReactElement;
