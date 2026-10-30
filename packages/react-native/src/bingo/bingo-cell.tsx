import { useEffect, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { getFixedCellTextProps } from '../internal/fixed-cell-text';
import type { BingoCellRenderInfo } from './types';

interface BingoCellProps extends BingoCellRenderInfo {
  readonly accessibilityLabel: string;
  /** Rendered edge length of the square cell, used to cap system font scaling. */
  readonly cellSize: number;
  readonly duration: number;
  readonly onPress: () => void;
  readonly renderCell?: (info: BingoCellRenderInfo) => ReactNode;
}

export function BingoCell({
  accessibilityLabel,
  cellSize,
  duration,
  onPress,
  renderCell,
  ...info
}: BingoCellProps) {
  const progress = useSharedValue(info.marked ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(info.marked ? 1 : 0, { duration });
  }, [duration, info.marked, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.82 + progress.value * 0.18,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));
  const foreground = info.marked ? info.theme.colors.onPrimary : info.theme.colors.text;
  const fontSize = info.theme.typography.labelSize + 2;
  // A matched cell draws a 3px border on each side inside the square.
  const textProps = getFixedCellTextProps(fontSize, cellSize - 6);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ checked: info.marked, disabled: info.disabled }}
      disabled={info.disabled}
      onPress={onPress}
      style={{ aspectRatio: 1, flex: 1 }}
    >
      <Animated.View
        style={[
          {
            alignItems: 'center',
            backgroundColor:
              info.value === 'free'
                ? info.theme.colors.bingoFree
                : info.marked
                  ? info.theme.colors.bingoMarked
                  : info.theme.colors.surface,
            borderColor: info.matched ? info.theme.colors.bingoFree : info.theme.colors.border,
            borderCurve: 'continuous',
            borderRadius: info.theme.radii.sm,
            borderWidth: info.matched ? 3 : 1,
            height: '100%',
            justifyContent: 'center',
            width: '100%',
          },
          animatedStyle,
        ]}
      >
        {renderCell === undefined ? (
          <Text
            {...textProps}
            selectable
            style={{
              color: foreground,
              fontFamily: info.theme.typography.fontFamily,
              fontSize,
              fontVariant: ['tabular-nums'],
              fontWeight: '900',
            }}
          >
            {info.value === 'free' ? 'FREE' : info.value}
          </Text>
        ) : (
          <View pointerEvents="none">{renderCell(info)}</View>
        )}
      </Animated.View>
    </Pressable>
  );
}
