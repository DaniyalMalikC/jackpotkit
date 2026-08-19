import type { SlotSymbol } from '@jackpotkit/core';
import type { JackpotTheme } from '@jackpotkit/theme';
import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type EasingFunction,
} from 'react-native-reanimated';

import type { SlotSymbolRenderInfo } from './types';

interface SlotReelProps<TValue> {
  readonly active: boolean;
  readonly destination: readonly SlotSymbol<TValue>[];
  readonly duration: number;
  readonly easing: EasingFunction;
  readonly onStop: (reelIndex: number, operation: number) => void;
  readonly operation: number;
  readonly reelDelay: number;
  readonly reelIndex: number;
  readonly renderSymbol?: (info: SlotSymbolRenderInfo<TValue>) => React.ReactNode;
  readonly rowCount: number;
  readonly symbolHeight: number;
  readonly symbols: readonly SlotSymbol<TValue>[];
  readonly theme: JackpotTheme;
  readonly winningCells: ReadonlySet<string>;
  readonly width: number;
}

export function SlotReel<TValue>({
  active,
  destination,
  duration,
  easing,
  onStop,
  operation,
  reelDelay,
  reelIndex,
  renderSymbol,
  rowCount,
  symbolHeight,
  symbols,
  theme,
  winningCells,
  width,
}: SlotReelProps<TValue>) {
  const filler = useMemo(
    () =>
      Array.from(
        { length: Math.max(8, symbols.length * 2) + reelIndex * 2 },
        (_, index) => symbols[(index + reelIndex) % symbols.length] as SlotSymbol<TValue>,
      ),
    [reelIndex, symbols],
  );
  const offset = useSharedValue(-filler.length * symbolHeight);
  const strip = [...filler, ...destination];
  const target = -filler.length * symbolHeight;
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  useEffect(() => {
    cancelAnimation(offset);
    if (!active) {
      offset.set(target);
      return;
    }

    offset.set(0);
    offset.set(
      withDelay(
        reelIndex * reelDelay,
        withTiming(target, { duration, easing }, (finished) => {
          if (finished) runOnJS(onStop)(reelIndex, operation);
        }),
      ),
    );

    return () => cancelAnimation(offset);
  }, [active, duration, easing, offset, onStop, operation, reelDelay, reelIndex, target]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.slotAccent,
        borderCurve: 'continuous',
        borderRadius: theme.radii.md,
        borderWidth: 2,
        boxShadow:
          'inset 0 12px 18px rgba(23, 20, 43, 0.12), inset 0 -12px 18px rgba(23, 20, 43, 0.12)',
        height: rowCount * symbolHeight,
        overflow: 'hidden',
        width,
      }}
      testID="jackpotkit-slot-reel"
    >
      <Animated.View style={animatedStyle}>
        {strip.map((symbol, stripIndex) => {
          const rowIndex = stripIndex - filler.length;
          const winning = rowIndex >= 0 && winningCells.has(`${reelIndex}:${rowIndex}`);
          return (
            <View
              key={`${operation}:${stripIndex}:${symbol.id}`}
              style={{
                alignItems: 'center',
                backgroundColor: winning ? theme.colors.slotAccent : theme.colors.surface,
                borderBottomColor: theme.colors.border,
                borderBottomWidth: 1,
                height: symbolHeight,
                justifyContent: 'center',
                paddingHorizontal: theme.spacing.xs,
              }}
            >
              {renderSymbol === undefined ? (
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                  numberOfLines={1}
                  selectable
                  style={{
                    color: winning ? theme.colors.onPrimary : theme.colors.text,
                    fontFamily: theme.typography.fontFamily,
                    fontSize: Math.min(28, symbolHeight * 0.38),
                    fontWeight: '900',
                    textAlign: 'center',
                  }}
                >
                  {symbol.label ??
                    (typeof symbol.value === 'string' || typeof symbol.value === 'number'
                      ? String(symbol.value)
                      : symbol.id)}
                </Text>
              ) : (
                renderSymbol({ reelIndex, rowIndex: Math.max(0, rowIndex), symbol, theme, winning })
              )}
            </View>
          );
        })}
      </Animated.View>
      <View
        pointerEvents="none"
        style={{
          backgroundColor: 'rgba(23, 20, 43, 0.1)',
          height: 10,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          backgroundColor: 'rgba(23, 20, 43, 0.1)',
          bottom: 0,
          height: 10,
          left: 0,
          position: 'absolute',
          right: 0,
        }}
      />
    </View>
  );
}
