import { createJackpotTheme } from '@jackpotkit/theme';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  type ReactElement,
  type RefAttributes,
} from 'react';
import { AccessibilityInfo, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useJackpotKitTheme } from '../theme-provider';
import { BingoCell } from './bingo-cell';
import type { BingoCellRenderInfo, BingoProps, BingoRef } from './types';
import { useBingo } from './use-bingo';
import { assertBingoComponentConfiguration } from './validation';

const CLASSIC_HEADERS = Object.freeze(['B', 'I', 'N', 'G', 'O']);

function BingoInner(props: BingoProps, ref: React.ForwardedRef<BingoRef>) {
  const {
    accessibilityLabel,
    accessibilityLabels = {},
    cellGap = 6,
    reduceMotion,
    renderCell,
    showCallButton = true,
    style,
    theme: themeOverride,
    width,
  } = props;
  const providerTheme = useJackpotKitTheme();
  assertBingoComponentConfiguration(width, cellGap);
  const theme = useMemo(
    () => createJackpotTheme(themeOverride, providerTheme),
    [providerTheme, themeOverride],
  );
  const labels = useMemo(
    () => ({
      board: accessibilityLabels.board ?? accessibilityLabel ?? 'Bingo board',
      call: accessibilityLabels.call ?? 'Call next Bingo number',
      completed:
        accessibilityLabels.completed ??
        ((result) => `Bingo! Completed ${result.matches.map((match) => match.label).join(', ')}.`),
      cell:
        accessibilityLabels.cell ??
        ((info: Omit<BingoCellRenderInfo, 'theme'>) =>
          info.value === 'free'
            ? 'Free space, marked'
            : `Number ${info.value}${info.called ? ', called' : ', not called'}${info.marked ? ', marked' : ''}`),
    }),
    [accessibilityLabel, accessibilityLabels],
  );
  const handleComplete = useCallback(
    (result: Parameters<NonNullable<BingoProps['onComplete']>>[0]) => {
      AccessibilityInfo.announceForAccessibility(labels.completed(result));
      props.onComplete?.(result);
    },
    [labels, props],
  );
  const handleCall = useCallback(
    (number: number, state: Parameters<NonNullable<BingoProps['onCall']>>[1]) => {
      AccessibilityInfo.announceForAccessibility(`Called ${number}.`);
      props.onCall?.(number, state);
    },
    [props],
  );
  const controller = useBingo({ ...props, onCall: handleCall, onComplete: handleComplete });
  const { width: windowWidth } = useWindowDimensions();
  const boardWidth = width ?? Math.min(520, Math.max(260, windowWidth - 48));
  const systemReducedMotion = useReducedMotion();
  const duration =
    reduceMotion === true || systemReducedMotion
      ? theme.animation.reducedMotionDuration
      : theme.animation.bingoMarkDuration;
  const called = useMemo(() => new Set(controller.state.calledNumbers), [controller.state]);
  const marked = useMemo(() => new Set(controller.state.markedNumbers), [controller.state]);
  const matched = useMemo(() => {
    const cells = new Set<string>();
    controller.state.matches.forEach((match) =>
      match.cells.forEach(({ row, column }) => cells.add(`${row}:${column}`)),
    );
    return cells;
  }, [controller.state]);
  const headers =
    controller.board.length === 5
      ? CLASSIC_HEADERS
      : controller.board.map((_, index) => String(index + 1));
  const isDisabled = controller.status === 'disabled';
  const lastCalled = controller.state.calledNumbers.at(-1);
  const minNumber = props.minNumber ?? 1;
  const maxNumber = props.maxNumber ?? 75;
  const allNumbersCalled = controller.state.calledNumbers.length >= maxNumber - minNumber + 1;

  useImperativeHandle(
    ref,
    () => ({
      call: controller.call,
      check: controller.check,
      draw: controller.draw,
      mark: controller.mark,
      reset: controller.reset,
      unmark: controller.unmark,
    }),
    [controller],
  );

  return (
    <View
      accessibilityLabel={labels.board}
      style={[{ alignItems: 'center', gap: theme.spacing.md, width: boardWidth }, style]}
    >
      <View style={{ gap: cellGap, width: boardWidth }}>
        <View style={{ flexDirection: 'row', gap: cellGap }}>
          {headers.map((header) => (
            <Text
              key={header}
              selectable
              style={{
                color: theme.colors.bingoMarked,
                flex: 1,
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.titleSize,
                fontWeight: '900',
                textAlign: 'center',
              }}
            >
              {header}
            </Text>
          ))}
        </View>
        {controller.board.map((row, rowIndex) => (
          <View key={rowIndex} style={{ flexDirection: 'row', gap: cellGap }}>
            {row.map((value, columnIndex) => {
              const free = value === 'free';
              const isCalled = free || called.has(value as number);
              const isMarked = free || marked.has(value as number);
              const info: BingoCellRenderInfo = {
                value,
                rowIndex,
                columnIndex,
                called: isCalled,
                marked: isMarked,
                matched: matched.has(`${rowIndex}:${columnIndex}`),
                disabled: free || isDisabled || !isCalled,
                theme,
              };
              return (
                <BingoCell
                  {...info}
                  accessibilityLabel={labels.cell(info)}
                  duration={duration}
                  key={`${rowIndex}:${columnIndex}`}
                  onPress={() => {
                    if (typeof value === 'number') controller.toggleMark(value);
                  }}
                  {...(renderCell === undefined ? {} : { renderCell })}
                />
              );
            })}
          </View>
        ))}
      </View>

      {showCallButton ? (
        <Pressable
          accessibilityLabel={labels.call}
          accessibilityRole="button"
          accessibilityState={{
            disabled: isDisabled || controller.state.completed || allNumbersCalled,
          }}
          disabled={isDisabled || controller.state.completed || allNumbersCalled}
          onPress={() => controller.draw()}
          style={({ pressed }) => ({
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
              fontWeight: '900',
            }}
          >
            {allNumbersCalled
              ? 'All numbers called'
              : lastCalled === undefined
                ? 'Call next number'
                : `Last call: ${lastCalled}`}
          </Text>
        </Pressable>
      ) : null}

      {controller.result !== undefined ? (
        <Text
          accessibilityLiveRegion="polite"
          selectable
          style={{
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.titleSize,
            fontWeight: '900',
            textAlign: 'center',
          }}
        >
          {labels.completed(controller.result)}
        </Text>
      ) : null}
    </View>
  );
}

export const Bingo = forwardRef(BingoInner) as (
  props: BingoProps & RefAttributes<BingoRef>,
) => ReactElement;
