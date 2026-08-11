import type { GameStatus, ScratchCardResult } from '@jackpotkit/core';
import { ScratchCard, type ScratchCardRef } from '@jackpotkit/react-native/scratch-card';
import { defaultTheme, neonTheme } from '@jackpotkit/theme';
import { Group, RoundedRect } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

type CoverName = 'solid' | 'stripes';
type ResultMode = 'controlled' | 'server';
type ThemeName = 'default' | 'neon';

interface Prize {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

interface OptionControlProps<TValue extends string | number> {
  readonly label: string;
  readonly onChange: (value: TValue) => void;
  readonly options: readonly TValue[];
  readonly value: TValue;
  readonly format?: (value: TValue) => string;
}

const controlledPrize: Prize = {
  id: 'points',
  label: 'Bonus points',
  value: '+250',
};

const serverPrize: Prize = {
  id: 'badge',
  label: 'Server-selected badge',
  value: 'EARLY BIRD',
};

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

export default function ScratchCardPlayground() {
  const cardRef = useRef<ScratchCardRef<Prize>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.min(420, Math.max(260, windowWidth - 72));
  const cardHeight = Math.round(cardWidth * 0.56);
  const [threshold, setThreshold] = useState(0.65);
  const [brushRadius, setBrushRadius] = useState(22);
  const [mode, setMode] = useState<ResultMode>('controlled');
  const [coverName, setCoverName] = useState<CoverName>('solid');
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [autoReveal, setAutoReveal] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [status, setStatus] = useState<GameStatus>('ready');
  const [progress, setProgress] = useState(0);
  const [lastResult, setLastResult] = useState<ScratchCardResult<Prize>>();
  const theme = themeName === 'neon' ? neonTheme : defaultTheme;
  const controlledResult = useMemo(() => ({ prize: controlledPrize }), []);

  const reset = useCallback(() => {
    cardRef.current?.reset();
    setLastResult(undefined);
    setProgress(0);
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
    await new Promise((resolve) => setTimeout(resolve, 350));
    return { prize: serverPrize, metadata: { authority: 'mock-server' } };
  }, []);

  const handleComplete = useCallback((result: ScratchCardResult<Prize>) => {
    setLastResult(result);
    if (process.env.EXPO_OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const reveal = useCallback(() => {
    void cardRef.current?.reveal().catch(() => undefined);
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
          SKIA · GESTURE REVEAL
        </Text>
        <Text selectable style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900' }}>
          Scratch Card playground
        </Text>
        <Text selectable style={{ color: '#D7D0F3', fontSize: 15, lineHeight: 22 }}>
          Scratch the cover, compare thresholds and brush sizes, and switch between controlled and
          mocked server-authoritative prizes.
        </Text>
      </View>

      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          borderCurve: 'continuous',
          borderRadius: 24,
          borderWidth: 1,
          gap: 16,
          padding: 18,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <Text selectable style={{ color: theme.colors.text, fontWeight: '800' }}>
            Status: {status}
          </Text>
          <Text selectable style={{ color: theme.colors.mutedText, fontVariant: ['tabular-nums'] }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>

        <ScratchCard
          ref={cardRef}
          accessibilityLabels={{
            result: (result) => `Revealed ${result.prize?.label ?? 'reward'}`,
            reveal: 'Reveal the example Scratch Card',
          }}
          autoReveal={autoReveal}
          brushRadius={brushRadius}
          cover={{ type: 'solid', color: theme.colors.scratchCover }}
          height={cardHeight}
          onComplete={handleComplete}
          onProgress={setProgress}
          onStatusChange={setStatus}
          reduceMotion={reduceMotion}
          {...(coverName === 'stripes'
            ? {
                renderCover: ({ height, width }) => (
                  <Group opacity={0.7}>
                    {Array.from({ length: 7 }, (_, index) => (
                      <RoundedRect
                        color={index % 2 === 0 ? theme.colors.scratchAccent : theme.colors.primary}
                        height={height}
                        key={index}
                        r={0}
                        width={width / 7}
                        x={(index * width) / 7}
                        y={0}
                      />
                    ))}
                  </Group>
                ),
              }
            : {})}
          threshold={threshold}
          theme={theme}
          width={cardWidth}
          {...(mode === 'controlled' ? { result: controlledResult } : { resultProvider })}
        >
          {(result) => (
            <View style={{ alignItems: 'center', gap: 8, padding: 16 }}>
              <Text
                selectable
                style={{ color: theme.colors.mutedText, fontSize: 13, fontWeight: '800' }}
              >
                {result === undefined ? 'RESOLVING PRIZE' : result.prize?.label}
              </Text>
              <Text
                selectable
                style={{ color: theme.colors.primary, fontSize: 30, fontWeight: '900' }}
              >
                {result?.prize?.value ?? '•••'}
              </Text>
            </View>
          )}
        </ScratchCard>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            onPress={reset}
            style={({ pressed }) => ({
              borderColor: theme.colors.border,
              borderRadius: 12,
              borderWidth: 1,
              opacity: pressed ? 0.72 : 1,
              paddingHorizontal: 18,
              paddingVertical: 11,
            })}
          >
            <Text selectable style={{ color: theme.colors.text, fontWeight: '800' }}>
              Reset
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={reveal}
            style={({ pressed }) => ({
              backgroundColor: theme.colors.primary,
              borderRadius: 12,
              opacity: pressed ? 0.8 : 1,
              paddingHorizontal: 18,
              paddingVertical: 11,
            })}
          >
            <Text selectable style={{ color: theme.colors.onPrimary, fontWeight: '800' }}>
              Reveal
            </Text>
          </Pressable>
        </View>

        {lastResult === undefined ? null : (
          <Text accessibilityLiveRegion="polite" selectable style={{ color: theme.colors.text }}>
            Result ID: {lastResult.prize?.id ?? 'none'}
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
          format={(value) => `${Math.round(Number(value) * 100)}%`}
          label="Completion threshold"
          onChange={changeSetting(setThreshold)}
          options={[0.45, 0.65, 0.8]}
          value={threshold}
        />
        <OptionControl
          format={(value) => `${value}px`}
          label="Brush radius"
          onChange={changeSetting(setBrushRadius)}
          options={[14, 22, 30]}
          value={brushRadius}
        />
        <OptionControl
          label="Result mode"
          onChange={changeSetting(setMode)}
          options={['controlled', 'server']}
          value={mode}
        />
        <OptionControl
          label="Cover"
          onChange={changeSetting(setCoverName)}
          options={['solid', 'stripes']}
          value={coverName}
        />
        <OptionControl
          label="Theme"
          onChange={changeSetting(setThemeName)}
          options={['default', 'neon']}
          value={themeName}
        />
        <OptionControl
          format={(value) => (value === 'on' ? 'On' : 'Off')}
          label="Auto reveal"
          onChange={(value) => changeSetting(setAutoReveal)(value === 'on')}
          options={['off', 'on']}
          value={autoReveal ? 'on' : 'off'}
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
          The scratch mask only reveals presentation. Valuable prizes must be selected and persisted
          by your backend; never infer an award from scratched pixels or client callbacks.
        </Text>
      </View>
    </View>
  );
}
