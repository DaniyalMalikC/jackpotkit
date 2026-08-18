import type { GameStatus, SpinWheelResult, WheelSegment } from '@jackpotkit/core';
import { JackpotKitProvider, SpinWheel, type SpinWheelRef } from '@jackpotkit/react-native';
import { defaultTheme, neonTheme } from '@jackpotkit/theme';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

type ResultMode = 'random' | 'controlled' | 'server';
type ProbabilityMode = 'equal' | 'weighted';
type ThemeName = 'default' | 'neon';

const allSegments = [
  { color: '#6843D5', id: '10', label: '10 points', value: 10, weight: 5 },
  { color: '#EB4D8A', id: '25', label: '25 points', value: 25, weight: 3 },
  { color: '#F3A712', id: 'again', label: 'Try again', value: 0, weight: 4 },
  { color: '#18A999', id: '50', label: '50 points', value: 50, weight: 2 },
  { color: '#3F7CAC', id: 'badge', label: 'Bonus badge', value: 0, weight: 1 },
  { color: '#9B5DE5', id: '100', label: '100 points', value: 100, weight: 0.5 },
  { color: '#EF476F', id: 'boost', label: '2× boost', value: 0, weight: 1 },
  { color: '#06D6A0', id: 'mystery', label: 'Mystery', value: 0, weight: 0.5 },
] as const satisfies readonly WheelSegment<number>[];

interface OptionControlProps<TValue extends string | number> {
  readonly label: string;
  readonly onChange: (value: TValue) => void;
  readonly options: readonly TValue[];
  readonly value: TValue;
  readonly format?: (value: TValue) => string;
}

function OptionControl<TValue extends string | number>({
  format = String,
  label,
  onChange,
  options,
  value,
}: OptionControlProps<TValue>) {
  return (
    <View style={{ gap: 9 }}>
      <Text selectable style={{ color: '#31264F', fontSize: 14, fontWeight: '800' }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((option) => {
          const selected = option === value;

          return (
            <Pressable
              accessibilityLabel={`${label}: ${format(option)}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option}
              onPress={() => onChange(option)}
              style={({ pressed }) => ({
                backgroundColor: selected ? '#6843D5' : '#F0ECFA',
                borderCurve: 'continuous',
                borderRadius: 12,
                opacity: pressed ? 0.78 : 1,
                paddingHorizontal: 13,
                paddingVertical: 10,
              })}
            >
              <Text
                selectable
                style={{ color: selected ? '#FFFFFF' : '#4D4269', fontWeight: '700' }}
              >
                {format(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SpinWheelPlayground() {
  const wheelRef = useRef<SpinWheelRef<number>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [segmentCount, setSegmentCount] = useState(6);
  const [duration, setDuration] = useState(1_600);
  const [rotations, setRotations] = useState(4);
  const [mode, setMode] = useState<ResultMode>('random');
  const [probabilityMode, setProbabilityMode] = useState<ProbabilityMode>('equal');
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [status, setStatus] = useState<GameStatus>('ready');
  const [lastResult, setLastResult] = useState<SpinWheelResult<number>>();
  const segments = useMemo(
    () =>
      allSegments.slice(0, segmentCount).map((segment) => ({
        ...segment,
        weight: probabilityMode === 'equal' ? 1 : segment.weight,
      })),
    [probabilityMode, segmentCount],
  );
  const wheelSize = Math.min(420, Math.max(200, windowWidth - 72));
  const controlledResult = useMemo(
    () => ({ segmentId: (segments.at(-1) ?? allSegments[0]).id }),
    [segments],
  );
  const theme = themeName === 'neon' ? neonTheme : defaultTheme;

  const reset = useCallback(() => {
    wheelRef.current?.reset();
    setLastResult(undefined);
  }, []);

  const changeSetting = useCallback(
    <TValue,>(setter: (value: TValue) => void) =>
      (value: TValue) => {
        reset();
        setter(value);
      },
    [reset],
  );

  const resultProvider = useCallback(async () => {
    await Promise.resolve();
    return { segmentId: (segments.at(-1) ?? allSegments[0]).id };
  }, [segments]);

  const handleComplete = useCallback((result: SpinWheelResult<number>) => {
    setLastResult(result);

    if (process.env.EXPO_OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  return (
    <View style={{ gap: 20 }}>
      <View
        style={{
          backgroundColor: '#221A47',
          borderCurve: 'continuous',
          borderRadius: 24,
          gap: 10,
          padding: 22,
        }}
      >
        <Text
          selectable
          style={{ color: '#B7A6FF', fontSize: 12, fontWeight: '900', letterSpacing: 1 }}
        >
          END-TO-END REFERENCE
        </Text>
        <Text selectable style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900' }}>
          Spin Wheel playground
        </Text>
        <Text selectable style={{ color: '#D7D0F3', fontSize: 15, lineHeight: 22 }}>
          Equal chances are the default. Switch to weighted probability to demonstrate independent
          result odds while every visible slice remains the same size.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          borderCurve: 'continuous',
          borderRadius: 24,
          borderWidth: 1,
          gap: 12,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text selectable style={{ color: theme.colors.text, fontWeight: '800' }}>
            Status: {status}
          </Text>
          <Text selectable style={{ color: theme.colors.mutedText, fontVariant: ['tabular-nums'] }}>
            {duration}ms · {rotations} turns
          </Text>
        </View>

        <JackpotKitProvider theme={theme}>
          <SpinWheel
            ref={wheelRef}
            accessibilityLabels={{
              result: (result) => `Selected ${result.segment.label ?? result.segment.id}`,
              spin: 'Spin the example wheel',
              spinning: 'Wheel spinning',
            }}
            duration={duration}
            onComplete={handleComplete}
            onStatusChange={setStatus}
            reduceMotion={reduceMotion}
            rotations={rotations}
            segments={segments}
            size={wheelSize}
            {...(mode === 'controlled' ? { result: controlledResult } : {})}
            {...(mode === 'server' ? { resultProvider } : {})}
          />
        </JackpotKitProvider>

        <Pressable
          accessibilityRole="button"
          onPress={reset}
          style={({ pressed }) => ({
            alignSelf: 'center',
            borderColor: theme.colors.border,
            borderRadius: 12,
            borderWidth: 1,
            opacity: pressed ? 0.72 : 1,
            paddingHorizontal: 18,
            paddingVertical: 11,
          })}
        >
          <Text selectable style={{ color: theme.colors.text, fontWeight: '800' }}>
            Reset wheel
          </Text>
        </Pressable>

        {lastResult === undefined ? null : (
          <Text
            accessibilityLiveRegion="polite"
            selectable
            style={{ color: theme.colors.text, textAlign: 'center' }}
          >
            Result ID: {lastResult.segmentId}
          </Text>
        )}
      </View>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E0F1',
          borderCurve: 'continuous',
          borderRadius: 24,
          borderWidth: 1,
          gap: 18,
          padding: 18,
        }}
      >
        <Text selectable style={{ color: '#17142B', fontSize: 20, fontWeight: '900' }}>
          Developer controls
        </Text>
        <OptionControl
          label="Segments"
          onChange={changeSetting(setSegmentCount)}
          options={[4, 6, 8]}
          value={segmentCount}
        />
        <OptionControl
          format={(value) => `${value}ms`}
          label="Duration"
          onChange={changeSetting(setDuration)}
          options={[800, 1_600, 3_000]}
          value={duration}
        />
        <OptionControl
          label="Rotations"
          onChange={changeSetting(setRotations)}
          options={[2, 4, 6]}
          value={rotations}
        />
        <OptionControl
          format={(value) => (value === 'equal' ? 'Equal chance' : 'Weighted demo')}
          label="Probability"
          onChange={changeSetting(setProbabilityMode)}
          options={['equal', 'weighted']}
          value={probabilityMode}
        />
        <OptionControl
          label="Result mode"
          onChange={changeSetting(setMode)}
          options={['random', 'controlled', 'server']}
          value={mode}
        />
        <OptionControl
          label="Theme"
          onChange={changeSetting(setThemeName)}
          options={['default', 'neon']}
          value={themeName}
        />
        <OptionControl
          format={(value) => (value === 'on' ? 'On' : 'System default')}
          label="Reduced motion"
          onChange={(value) => changeSetting(setReduceMotion)(value === 'on')}
          options={['system', 'on']}
          value={reduceMotion ? 'on' : 'system'}
        />
      </View>

      <View
        style={{
          backgroundColor: '#FFF4D6',
          borderCurve: 'continuous',
          borderRadius: 18,
          gap: 6,
          padding: 16,
        }}
      >
        <Text selectable style={{ color: '#5D4300', fontWeight: '900' }}>
          Security boundary
        </Text>
        <Text selectable style={{ color: '#715B1E', lineHeight: 20 }}>
          Server mode is locally mocked. Real valuable outcomes must be validated, selected, and
          persisted by your backend before JackpotKit animates to the returned segment ID.
        </Text>
      </View>
    </View>
  );
}
