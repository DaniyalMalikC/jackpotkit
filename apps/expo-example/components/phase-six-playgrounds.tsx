import type {
  CoinFlipSelection,
  DiceSelection,
  LuckyBoxItem,
  LuckyBoxSelection,
} from '@jackpotkit/core';
import {
  CoinFlip,
  type CoinFaceRenderInfo,
  type CoinFlipRef,
} from '@jackpotkit/react-native/coin-flip';
import { Dice, type DiceRef, type DieRenderInfo } from '@jackpotkit/react-native/dice';
import {
  LuckyBox,
  type LuckyBoxRef,
  type LuckyBoxRenderInfo,
} from '@jackpotkit/react-native/lucky-box';
import { defaultTheme, neonTheme } from '@jackpotkit/theme';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

type ResultMode = 'random' | 'controlled' | 'server';
type ThemeName = 'default' | 'neon';

function Control<TValue extends string | number>({
  getOptionLabel = String,
  label,
  onChange,
  options,
  value,
}: {
  readonly getOptionLabel?: (value: TValue) => string;
  readonly label: string;
  readonly onChange: (value: TValue) => void;
  readonly options: readonly TValue[];
  readonly value: TValue;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: '#31264F', fontSize: 14, fontWeight: '800' }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((option) => {
          const selected = option === value;
          const optionLabel = getOptionLabel(option);
          return (
            <Pressable
              accessibilityLabel={`${label}: ${optionLabel}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={String(option)}
              onPress={() => onChange(option)}
              style={({ pressed }) => ({
                backgroundColor: selected ? '#6843D5' : '#F0ECFA',
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
                {optionLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Section({
  children,
  dark = false,
}: {
  readonly children: React.ReactNode;
  readonly dark?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: dark ? '#221A47' : '#FFFFFF',
        borderColor: dark ? '#221A47' : '#E5E0F1',
        borderRadius: 24,
        borderWidth: 1,
        gap: 16,
        padding: 20,
      }}
    >
      {children}
    </View>
  );
}

function Header({
  eyebrow,
  title,
  body,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
}) {
  return (
    <Section dark>
      <Text
        selectable
        style={{ color: '#B7A6FF', fontSize: 12, fontWeight: '900', letterSpacing: 1 }}
      >
        {eyebrow}
      </Text>
      <Text selectable style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900' }}>
        {title}
      </Text>
      <Text selectable style={{ color: '#D7D0F3', fontSize: 15, lineHeight: 22 }}>
        {body}
      </Text>
    </Section>
  );
}

function ResetButton({ onPress }: { readonly onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        borderColor: '#CFC6E8',
        borderRadius: 12,
        borderWidth: 1,
        opacity: pressed ? 0.72 : 1,
        paddingHorizontal: 18,
        paddingVertical: 11,
      })}
    >
      <Text selectable style={{ color: '#31264F', fontWeight: '800' }}>
        Reset
      </Text>
    </Pressable>
  );
}

export function DicePlayground() {
  const reference = useRef<DiceRef>(null);
  const { width: windowWidth } = useWindowDimensions();
  const componentWidth = Math.min(460, Math.max(200, windowWidth - 116));
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [mode, setMode] = useState<ResultMode>('random');
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [custom, setCustom] = useState<'standard' | 'custom'>('standard');
  const [diceFaceStyle, setDiceFaceStyle] = useState<'numbers' | 'pips'>('pips');
  const [motion, setMotion] = useState<'animated' | 'reduced'>('animated');
  const theme = themeName === 'neon' ? neonTheme : defaultTheme;
  const selection = useMemo<DiceSelection>(
    () => ({ values: Array.from({ length: count }, (_, index) => Math.min(sides, index + 2)) }),
    [count, sides],
  );
  const provider = useCallback(async (): Promise<DiceSelection> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return {
      values: Array.from({ length: count }, () => sides),
      metadata: { authority: 'mock-server' },
    };
  }, [count, sides]);
  const renderDie = useCallback(
    ({ die, value, theme: dieTheme }: DieRenderInfo) => (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: dieTheme.colors.primary,
          borderRadius: 18,
          height: 76,
          justifyContent: 'center',
          width: 76,
        }}
      >
        <Text
          selectable
          style={{ color: dieTheme.colors.onPrimary, fontSize: 13, fontWeight: '800' }}
        >
          D{die.sides}
        </Text>
        <Text
          selectable
          style={{ color: dieTheme.colors.onPrimary, fontSize: 28, fontWeight: '900' }}
        >
          {value}
        </Text>
      </View>
    ),
    [],
  );
  const reset = () => reference.current?.reset();
  return (
    <View style={{ gap: 20 }}>
      <Header
        eyebrow="MULTI-DIE · EXACT VALUES · D4–CUSTOM"
        title="Dice playground"
        body="Roll one or many standard or custom-sided dice, then compare random, controlled, and mocked server results."
      />
      <Section>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            borderRadius: 20,
            gap: 16,
            padding: 18,
          }}
        >
          <Dice
            count={count}
            key={`${count}:${sides}`}
            reduceMotion={motion === 'reduced'}
            ref={reference}
            sides={sides}
            theme={theme}
            faceStyle={diceFaceStyle}
            width={componentWidth}
            {...(custom === 'custom' ? { renderDie } : {})}
            {...(mode === 'controlled'
              ? { result: selection }
              : mode === 'server'
                ? { resultProvider: provider }
                : {})}
          />
          <ResetButton onPress={reset} />
        </View>
      </Section>
      <Section>
        <Text selectable style={{ color: '#17142B', fontSize: 20, fontWeight: '900' }}>
          Developer controls
        </Text>
        <Control
          label="Dice"
          onChange={(value) => {
            reset();
            setCount(value);
          }}
          options={[1, 2, 4]}
          value={count}
        />
        <Control
          label="Sides"
          onChange={(value) => {
            reset();
            setSides(value);
          }}
          options={[4, 6, 8, 10, 12, 20]}
          value={sides}
        />
        <Control
          label="Result"
          onChange={(value) => {
            reset();
            setMode(value);
          }}
          options={['random', 'controlled', 'server']}
          value={mode}
        />
        <Control
          label="Face style"
          onChange={(value) => {
            reset();
            setDiceFaceStyle(value);
          }}
          options={['numbers', 'pips']}
          value={diceFaceStyle}
        />
        <Control
          label="Renderer"
          onChange={setCustom}
          options={['standard', 'custom']}
          value={custom}
        />
        <Control
          label="Theme"
          onChange={setThemeName}
          options={['default', 'neon']}
          value={themeName}
        />
        <Control
          label="Motion"
          onChange={setMotion}
          options={['animated', 'reduced']}
          value={motion}
        />
      </Section>
    </View>
  );
}

const customFaces = [
  { id: 'sun', label: 'Sun', value: 'day' },
  { id: 'moon', label: 'Moon', value: 'night' },
] as const;

export function CoinFlipPlayground() {
  const reference = useRef<CoinFlipRef<string>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const coinSize = Math.min(160, Math.max(120, windowWidth - 116));
  const [mode, setMode] = useState<ResultMode>('random');
  const [faceContent, setFaceContent] = useState<'custom' | 'standard'>('standard');
  const [coinFaceStyle, setCoinFaceStyle] = useState<'embossed' | 'flat'>('embossed');
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [motion, setMotion] = useState<'animated' | 'reduced'>('animated');
  const theme = themeName === 'neon' ? neonTheme : defaultTheme;
  const controlled: CoinFlipSelection = { faceId: faceContent === 'custom' ? 'moon' : 'tails' };
  const provider = useCallback(async (): Promise<CoinFlipSelection> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return {
      faceId: faceContent === 'custom' ? 'sun' : 'heads',
      metadata: { authority: 'mock-server' },
    };
  }, [faceContent]);
  const renderFace = useCallback(
    ({ face, theme: faceTheme }: CoinFaceRenderInfo<string>) => (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: faceTheme.colors.coinFront,
          borderRadius: 80,
          height: 160,
          justifyContent: 'center',
          width: 160,
        }}
      >
        <Text selectable style={{ color: faceTheme.colors.dicePip, fontSize: 42 }}>
          {face.id === 'sun' ? '☀️' : '🌙'}
        </Text>
        <Text selectable style={{ color: faceTheme.colors.dicePip, fontWeight: '900' }}>
          {face.label}
        </Text>
      </View>
    ),
    [],
  );
  const reset = () => reference.current?.reset();
  return (
    <View style={{ gap: 20 }}>
      <Header
        eyebrow="TWO FACES · CONTROLLED DESTINATION"
        title="Coin Flip playground"
        body="Use standard heads and tails or define exactly two custom values. The destination is resolved before the flip begins."
      />
      <Section>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            borderRadius: 20,
            gap: 16,
            padding: 18,
          }}
        >
          <CoinFlip<string>
            faceStyle={coinFaceStyle}
            key={faceContent}
            reduceMotion={motion === 'reduced'}
            ref={reference}
            size={coinSize}
            theme={theme}
            {...(faceContent === 'custom' ? { faces: customFaces, renderFace } : {})}
            {...(mode === 'controlled'
              ? { result: controlled }
              : mode === 'server'
                ? { resultProvider: provider }
                : {})}
          />
          <ResetButton onPress={reset} />
        </View>
      </Section>
      <Section>
        <Text selectable style={{ color: '#17142B', fontSize: 20, fontWeight: '900' }}>
          Developer controls
        </Text>
        <Control
          label="Face content"
          onChange={(value) => {
            reset();
            setFaceContent(value);
          }}
          options={['standard', 'custom']}
          value={faceContent}
        />
        <Control
          label="Face style"
          onChange={(value) => {
            reset();
            setCoinFaceStyle(value);
          }}
          options={['flat', 'embossed']}
          value={coinFaceStyle}
        />
        <Control
          label="Result"
          onChange={(value) => {
            reset();
            setMode(value);
          }}
          options={['random', 'controlled', 'server']}
          value={mode}
        />
        <Control
          label="Theme"
          onChange={setThemeName}
          options={['default', 'neon']}
          value={themeName}
        />
        <Control
          label="Motion"
          onChange={setMotion}
          options={['animated', 'reduced']}
          value={motion}
        />
      </Section>
    </View>
  );
}

const luckyBoxes: readonly LuckyBoxItem<string>[] = [
  { id: 'violet', label: 'Violet gift', reward: 'VIP badge' },
  { id: 'gold', label: 'Golden gift', reward: 'Bonus points' },
  { id: 'mint', label: 'Mint gift' },
  { id: 'locked', label: 'Locked gift', disabled: true },
];

export function LuckyBoxPlayground() {
  const reference = useRef<LuckyBoxRef<string>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const componentWidth = Math.min(520, Math.max(200, windowWidth - 116));
  const [mode, setMode] = useState<ResultMode>('random');
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [renderer, setRenderer] = useState<'standard' | 'custom'>('standard');
  const [faceStyle, setFaceStyle] = useState<'gift-boxes' | 'tiles'>('gift-boxes');
  const [motion, setMotion] = useState<'animated' | 'reduced'>('animated');
  const theme = themeName === 'neon' ? neonTheme : defaultTheme;
  const controlled: LuckyBoxSelection = { boxId: 'gold' };
  const provider = useCallback(async (): Promise<LuckyBoxSelection> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { boxId: 'violet', metadata: { authority: 'mock-server' } };
  }, []);
  const renderBox = useCallback(
    ({ box, selected, winning, theme: boxTheme }: LuckyBoxRenderInfo<string>) => (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: selected ? boxTheme.colors.luckyBoxSelected : boxTheme.colors.luckyBox,
          borderColor: winning ? boxTheme.colors.primary : boxTheme.colors.border,
          borderRadius: 18,
          borderWidth: 2,
          justifyContent: 'center',
          minHeight: 96,
          padding: 10,
          width: (componentWidth - boxTheme.spacing.sm) / 2,
        }}
      >
        <Text selectable style={{ fontSize: 28 }}>
          {winning ? '🏆' : '🎁'}
        </Text>
        <Text
          selectable
          style={{
            color: selected ? boxTheme.colors.dicePip : boxTheme.colors.text,
            fontWeight: '900',
            textAlign: 'center',
          }}
        >
          {box.label}
        </Text>
      </View>
    ),
    [componentWidth],
  );
  const reset = () => reference.current?.reset();
  return (
    <View style={{ gap: 20 }}>
      <Header
        eyebrow="SELECT · REVEAL · OPTIONAL REWARD"
        title="Lucky Box playground"
        body="Select a box independently from the winning box, reveal a random or authoritative outcome, and reset for another play."
      />
      <Section>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            borderRadius: 20,
            gap: 16,
            padding: 18,
          }}
        >
          <LuckyBox<string>
            boxes={luckyBoxes}
            columns={2}
            faceStyle={faceStyle}
            reduceMotion={motion === 'reduced'}
            ref={reference}
            theme={theme}
            width={componentWidth}
            {...(renderer === 'custom' ? { renderBox } : {})}
            {...(mode === 'controlled'
              ? { result: controlled }
              : mode === 'server'
                ? { resultProvider: provider }
                : {})}
          />
          <ResetButton onPress={reset} />
        </View>
      </Section>
      <Section>
        <Text selectable style={{ color: '#17142B', fontSize: 20, fontWeight: '900' }}>
          Developer controls
        </Text>
        <Control
          label="Result"
          onChange={(value) => {
            reset();
            setMode(value);
          }}
          options={['random', 'controlled', 'server']}
          value={mode}
        />
        <Control
          getOptionLabel={(value) => (value === 'gift-boxes' ? 'Gift Box' : 'Tiles')}
          label="Face style"
          onChange={(value) => {
            reset();
            setFaceStyle(value);
          }}
          options={['tiles', 'gift-boxes']}
          value={faceStyle}
        />
        <Control
          label="Renderer"
          onChange={setRenderer}
          options={['standard', 'custom']}
          value={renderer}
        />
        <Control
          label="Theme"
          onChange={setThemeName}
          options={['default', 'neon']}
          value={themeName}
        />
        <Control
          label="Motion"
          onChange={setMotion}
          options={['animated', 'reduced']}
          value={motion}
        />
      </Section>
    </View>
  );
}
