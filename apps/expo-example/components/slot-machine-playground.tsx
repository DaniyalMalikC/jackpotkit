import type {
  GameStatus,
  SlotMachineResult,
  SlotMachineSelection,
  SlotPayline,
  SlotSymbol,
} from '@jackpotkit/core';
import { SlotMachine, type SlotMachineRef } from '@jackpotkit/react-native/slot-machine';
import { defaultTheme, neonTheme } from '@jackpotkit/theme';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

type ResultMode = 'random' | 'controlled' | 'server';
type PaylineMode = 'straight' | 'diagonal';
type ProbabilityMode = 'equal' | 'weighted';
type ThemeName = 'default' | 'neon';

interface Evaluation {
  readonly matchCount: number;
}

interface OptionControlProps<TValue extends string | number> {
  readonly label: string;
  readonly onChange: (value: TValue) => void;
  readonly options: readonly TValue[];
  readonly value: TValue;
  readonly format?: (value: TValue) => string;
}

const allSymbols: readonly SlotSymbol<string>[] = [
  { id: 'cherry', label: '🍒', value: 'Cherry', weight: 5 },
  { id: 'lemon', label: '🍋', value: 'Lemon', weight: 4 },
  { id: 'grape', label: '🍇', value: 'Grape', weight: 3 },
  { id: 'star', label: '⭐', value: 'Star', weight: 2 },
  { id: 'gift', label: '🎁', value: 'Gift', weight: 1 },
];

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

function createWinningSelection(
  reelCount: number,
  rowCount: number,
  symbolId = 'star',
): SlotMachineSelection {
  return {
    reels: Array.from({ length: reelCount }, (_, reelIndex) =>
      Array.from({ length: rowCount }, (_, rowIndex) =>
        rowIndex === 0
          ? symbolId
          : (allSymbols[(reelIndex + rowIndex) % allSymbols.length]?.id ?? 'cherry'),
      ),
    ),
  };
}

export default function SlotMachinePlayground() {
  const machineRef = useRef<SlotMachineRef<string, Evaluation>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [reelCount, setReelCount] = useState(3);
  const [rowCount, setRowCount] = useState(3);
  const [duration, setDuration] = useState(1_200);
  const [mode, setMode] = useState<ResultMode>('random');
  const [paylineMode, setPaylineMode] = useState<PaylineMode>('straight');
  const [probabilityMode, setProbabilityMode] = useState<ProbabilityMode>('equal');
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [status, setStatus] = useState<GameStatus>('ready');
  const [lastResult, setLastResult] = useState<SlotMachineResult<string, Evaluation>>();
  const theme = themeName === 'neon' ? neonTheme : defaultTheme;
  const machineWidth = Math.min(460, Math.max(220, windowWidth - 76));
  const symbols = useMemo(
    () =>
      allSymbols.map((symbol) => ({
        ...symbol,
        weight: probabilityMode === 'equal' ? 1 : (symbol.weight ?? 1),
      })),
    [probabilityMode],
  );
  const straightPaylines = useMemo<readonly SlotPayline[]>(
    () =>
      Array.from({ length: rowCount }, (_, row) => Array.from({ length: reelCount }, () => row)),
    [reelCount, rowCount],
  );
  const paylines = useMemo<readonly SlotPayline[]>(() => {
    if (paylineMode === 'straight' || rowCount === 1) return straightPaylines;
    const descending = Array.from({ length: reelCount }, (_, index) => index % rowCount);
    const ascending = descending.map((row) => rowCount - 1 - row);
    return [...straightPaylines, descending, ascending];
  }, [paylineMode, reelCount, rowCount, straightPaylines]);
  const controlledResult = useMemo(
    () => createWinningSelection(reelCount, rowCount),
    [reelCount, rowCount],
  );
  const resultProvider = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      ...createWinningSelection(reelCount, rowCount, 'gift'),
      metadata: { authority: 'mock-server' },
    };
  }, [reelCount, rowCount]);
  const reset = useCallback(() => {
    machineRef.current?.reset();
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
  const handleComplete = useCallback((result: SlotMachineResult<string, Evaluation>) => {
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
          WEIGHTED GRID · EXACT DESTINATION
        </Text>
        <Text selectable style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900' }}>
          Slot Machine playground
        </Text>
        <Text selectable style={{ color: '#D7D0F3', fontSize: 15, lineHeight: 22 }}>
          Equal symbol chances are the default. Compare them with an explicit weighted demo while
          changing reels, rows, paylines, and result modes.
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
        <Text selectable style={{ color: theme.colors.text, fontWeight: '800' }}>
          Status: {status}
        </Text>
        <SlotMachine
          ref={machineRef}
          accessibilityLabels={{
            result: (result) => `${result.winningPaylines.length} matching paylines`,
          }}
          duration={duration}
          evaluate={({ winningPaylines }) => ({ matchCount: winningPaylines.length })}
          onComplete={handleComplete}
          onStatusChange={setStatus}
          paylines={paylines}
          reduceMotion={reduceMotion}
          reelCount={reelCount}
          rowCount={rowCount}
          symbols={symbols}
          theme={theme}
          width={machineWidth}
          {...(mode === 'controlled'
            ? { result: controlledResult }
            : mode === 'server'
              ? { resultProvider }
              : {})}
        />
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
        {lastResult === undefined ? null : (
          <Text accessibilityLiveRegion="polite" selectable style={{ color: theme.colors.text }}>
            Result {lastResult.id}: {lastResult.evaluation?.matchCount ?? 0} matches
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
          label="Reels"
          onChange={changeSetting(setReelCount)}
          options={[3, 4, 5]}
          value={reelCount}
        />
        <OptionControl
          label="Rows"
          onChange={changeSetting(setRowCount)}
          options={[1, 2, 3]}
          value={rowCount}
        />
        <OptionControl
          format={(value) => `${Number(value) / 1_000}s`}
          label="Animation duration"
          onChange={changeSetting(setDuration)}
          options={[600, 1_200, 2_000]}
          value={duration}
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
          label="Paylines"
          onChange={changeSetting(setPaylineMode)}
          options={['straight', 'diagonal']}
          value={paylineMode}
        />
        <OptionControl
          label="Theme"
          onChange={changeSetting(setThemeName)}
          options={['default', 'neon']}
          value={themeName}
        />
        <OptionControl
          format={(value) => (value === 'on' ? 'Reduced' : 'System/default')}
          label="Motion"
          onChange={changeSetting((value: 'off' | 'on') => setReduceMotion(value === 'on'))}
          options={['off', 'on']}
          value={reduceMotion ? 'on' : 'off'}
        />
      </View>

      <View style={{ backgroundColor: '#FFF6D8', borderRadius: 18, gap: 8, padding: 16 }}>
        <Text selectable style={{ color: '#6F4E00', fontWeight: '900' }}>
          Result boundary
        </Text>
        <Text selectable style={{ color: '#6F4E00', lineHeight: 20 }}>
          Reel animation displays a grid already selected by core or your backend. It never
          calculates the winning destination.
        </Text>
      </View>
    </View>
  );
}
