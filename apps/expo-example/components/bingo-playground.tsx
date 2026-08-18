import {
  SeededRandomSource,
  createBingoBoard,
  type BingoBoard,
  type BingoPattern,
  type BingoResult,
  type GameStatus,
} from '@jackpotkit/core';
import { Bingo, type BingoCellRenderInfo, type BingoRef } from '@jackpotkit/react-native/bingo';
import { defaultTheme, neonTheme } from '@jackpotkit/theme';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

type BoardMode = 'generated' | 'supplied';
type PatternMode = 'classic' | 'corners' | 'blackout';
type ThemeName = 'default' | 'neon';

interface OptionControlProps<TValue extends string | number | boolean> {
  readonly label: string;
  readonly onChange: (value: TValue) => void;
  readonly options: readonly TValue[];
  readonly value: TValue;
  readonly format?: (value: TValue) => string;
}

function OptionControl<TValue extends string | number | boolean>({
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
              key={String(option)}
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

function createSuppliedBoard(size: number): BingoBoard {
  const center = Math.floor(size / 2);
  return Object.freeze(
    Array.from({ length: size }, (_, row) =>
      Object.freeze(
        Array.from({ length: size }, (_, column) =>
          row === center && column === center ? 'free' : column * 15 + row + 1,
        ),
      ),
    ),
  );
}

export default function BingoPlayground() {
  const bingoRef = useRef<BingoRef>(null);
  const { width: windowWidth } = useWindowDimensions();
  const boardWidth = Math.min(520, Math.max(220, windowWidth - 76));
  const [size, setSize] = useState(5);
  const [boardMode, setBoardMode] = useState<BoardMode>('generated');
  const [patternMode, setPatternMode] = useState<PatternMode>('classic');
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [seed, setSeed] = useState('launch-night');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [customCells, setCustomCells] = useState(false);
  const [status, setStatus] = useState<GameStatus>('ready');
  const [calledCount, setCalledCount] = useState(0);
  const [lastResult, setLastResult] = useState<BingoResult>();
  const maxNumber = size * 15;
  const theme = themeName === 'neon' ? neonTheme : defaultTheme;
  const board = useMemo(
    () =>
      boardMode === 'generated'
        ? createBingoBoard({
            maxNumber,
            randomSource: new SeededRandomSource(`${seed}:card`),
            size,
          })
        : createSuppliedBoard(size),
    [boardMode, maxNumber, seed, size],
  );
  const drawSource = useMemo(() => new SeededRandomSource(`${seed}:calls`), [seed]);
  const patterns = useMemo<readonly BingoPattern[]>(() => {
    if (patternMode === 'corners') return ['four-corners'];
    if (patternMode === 'blackout') return ['full-board'];
    return ['row', 'column', 'diagonal'];
  }, [patternMode]);

  const reset = useCallback(() => {
    bingoRef.current?.reset();
    setCalledCount(0);
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
  const completePattern = useCallback(() => {
    const cells =
      patternMode === 'corners'
        ? [board[0]?.[0], board[0]?.[size - 1], board[size - 1]?.[0], board[size - 1]?.[size - 1]]
        : patternMode === 'blackout'
          ? board.flat()
          : board[0];
    cells?.forEach((value) => {
      if (typeof value === 'number') {
        bingoRef.current?.call(value);
        bingoRef.current?.mark(value);
      }
    });
  }, [board, patternMode, size]);
  const handleComplete = useCallback((result: BingoResult) => {
    setLastResult(result);
    if (process.env.EXPO_OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);
  const renderCell = useCallback(
    ({ marked, value, theme: cellTheme }: BingoCellRenderInfo) => (
      <Text
        selectable
        style={{
          color: marked ? cellTheme.colors.onPrimary : cellTheme.colors.text,
          fontSize: size === 3 ? 22 : 14,
          fontWeight: '900',
        }}
      >
        {value === 'free' ? '★' : marked ? `✓ ${value}` : value}
      </Text>
    ),
    [size],
  );

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
          SEEDED CARD · PERSISTENT STATE · PATTERN CHECKS
        </Text>
        <Text selectable style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900' }}>
          Bingo playground
        </Text>
        <Text selectable style={{ color: '#D7D0F3', fontSize: 15, lineHeight: 22 }}>
          Generate or supply a card, draw deterministic calls, mark cells, and compare classic,
          corners, and blackout completion rules.
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
          Status: {status} · Calls: {calledCount}
        </Text>
        <Bingo
          ref={bingoRef}
          board={board}
          maxNumber={maxNumber}
          onCall={(_number, state) => setCalledCount(state.calledNumbers.length)}
          onComplete={handleComplete}
          onStatusChange={setStatus}
          patterns={patterns}
          randomSource={drawSource}
          reduceMotion={reduceMotion}
          {...(customCells ? { renderCell } : {})}
          size={size}
          theme={theme}
          width={boardWidth}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          <Pressable
            accessibilityRole="button"
            onPress={completePattern}
            style={{
              backgroundColor: theme.colors.bingoMarked,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 11,
            }}
          >
            <Text selectable style={{ color: theme.colors.onPrimary, fontWeight: '900' }}>
              Complete controlled pattern
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={reset}
            style={{
              borderColor: theme.colors.border,
              borderRadius: 12,
              borderWidth: 1,
              paddingHorizontal: 16,
              paddingVertical: 11,
            }}
          >
            <Text selectable style={{ color: theme.colors.text, fontWeight: '800' }}>
              Reset game
            </Text>
          </Pressable>
        </View>
        {lastResult !== undefined ? (
          <Text selectable style={{ color: theme.colors.text, textAlign: 'center' }}>
            Matched: {lastResult.matches.map((match) => match.label).join(', ')}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E0F1',
          borderCurve: 'continuous',
          borderRadius: 22,
          borderWidth: 1,
          gap: 18,
          padding: 18,
        }}
      >
        <Text selectable style={{ color: '#17142B', fontSize: 20, fontWeight: '900' }}>
          Developer controls
        </Text>
        <OptionControl
          label="Board size"
          onChange={changeSetting(setSize)}
          options={[3, 5]}
          value={size}
          format={(value) => `${value} × ${value}`}
        />
        <OptionControl
          label="Card source"
          onChange={changeSetting(setBoardMode)}
          options={['generated', 'supplied']}
          value={boardMode}
        />
        <OptionControl
          label="Pattern"
          onChange={changeSetting(setPatternMode)}
          options={['classic', 'corners', 'blackout']}
          value={patternMode}
        />
        <OptionControl
          label="Seed"
          onChange={changeSetting(setSeed)}
          options={['launch-night', 'vip-campaign']}
          value={seed}
        />
        <OptionControl
          label="Theme"
          onChange={changeSetting(setThemeName)}
          options={['default', 'neon']}
          value={themeName}
        />
        <OptionControl
          label="Reduced motion"
          onChange={changeSetting(setReduceMotion)}
          options={[false, true]}
          value={reduceMotion}
          format={(value) => (value ? 'On' : 'Off')}
        />
        <OptionControl
          label="Custom cells"
          onChange={changeSetting(setCustomCells)}
          options={[false, true]}
          value={customCells}
          format={(value) => (value ? 'On' : 'Off')}
        />
      </View>

      <View
        style={{
          backgroundColor: '#FFF8E6',
          borderColor: '#F0D68A',
          borderCurve: 'continuous',
          borderRadius: 18,
          borderWidth: 1,
          gap: 6,
          padding: 16,
        }}
      >
        <Text selectable style={{ color: '#5B4612', fontWeight: '900' }}>
          Production boundary
        </Text>
        <Text selectable style={{ color: '#705B25', lineHeight: 20 }}>
          For rewards with value, send authoritative calls into call(number). Treat local draw() as
          presentation and testing convenience, never as proof of entitlement.
        </Text>
      </View>
    </View>
  );
}
