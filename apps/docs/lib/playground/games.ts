import {
  DEFAULT_BINGO_MAX_NUMBER,
  DEFAULT_BINGO_MIN_NUMBER,
  DEFAULT_BINGO_PATTERNS,
  DEFAULT_BINGO_SIZE,
  DEFAULT_COIN_FACES,
  type BingoPattern,
  type CoinFace,
  type LuckyBoxItem,
  type SlotSymbol,
  type WheelSegment,
} from '@jackpotkit/core';
import type { Bingo } from '@jackpotkit/react/bingo';
import type { CoinFlip } from '@jackpotkit/react/coin-flip';
import type { Dice } from '@jackpotkit/react/dice';
import type { LuckyBox } from '@jackpotkit/react/lucky-box';
import type { ScratchCard } from '@jackpotkit/react/scratch-card';
import type { SlotMachine } from '@jackpotkit/react/slot-machine';
import type { SpinWheel } from '@jackpotkit/react/spin-wheel';
import { defaultTheme } from '@jackpotkit/theme';
import type { ComponentProps } from 'react';

import type { GameId } from '@/lib/games';

import {
  defineGameSchema,
  eraseSchema,
  type ErasedSchema,
  type GameSchema,
  type NumberControl,
  type SelectControl,
  type SelectOption,
  type TristateControl,
} from './schema';

/** Props of each game's real `@jackpotkit/react` component, read from the component itself. */
export interface PlaygroundPropsMap {
  readonly 'spin-wheel': Omit<ComponentProps<typeof SpinWheel>, 'ref'>;
  readonly 'scratch-card': Omit<ComponentProps<typeof ScratchCard>, 'ref'>;
  readonly 'slot-machine': Omit<ComponentProps<typeof SlotMachine>, 'ref'>;
  readonly bingo: Omit<ComponentProps<typeof Bingo>, 'ref'>;
  readonly dice: Omit<ComponentProps<typeof Dice>, 'ref'>;
  readonly 'coin-flip': Omit<ComponentProps<typeof CoinFlip>, 'ref'>;
  readonly 'lucky-box': Omit<ComponentProps<typeof LuckyBox>, 'ref'>;
}

const animation = defaultTheme.animation;
/** The easing every animated web renderer uses when `easing` is omitted. */
const LIBRARY_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

const easingOptions = [
  { label: 'Library default (ease-out curve)', value: LIBRARY_EASING },
  { label: 'ease', value: 'ease' },
  { label: 'ease-in-out', value: 'ease-in-out' },
  { label: 'linear', value: 'linear' },
  { label: 'Overshoot', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
] as const satisfies readonly SelectOption<string>[];

function durationControl<K extends 'duration' | 'revealDuration' = 'duration'>(
  fallback: number,
  prop: K = 'duration' as K,
): NumberControl<K> {
  return {
    kind: 'number',
    label: prop === 'duration' ? 'Duration' : 'Reveal duration',
    max: Math.max(6000, fallback * 3),
    min: 0,
    optional: { fallback, fallbackLabel: `Theme default (${fallback} ms)` },
    prop,
    section: 'animation',
    step: 50,
    unit: 'ms',
  };
}

function easingControl(): SelectControl<'easing', string> {
  return {
    kind: 'select',
    label: 'Easing',
    options: easingOptions,
    prop: 'easing',
    section: 'animation',
  };
}

function reduceMotionControl(): TristateControl<'reduceMotion'> {
  return {
    falseLabel: 'Full motion',
    kind: 'tristate',
    label: 'Reduce motion',
    prop: 'reduceMotion',
    section: 'animation',
    trueLabel: 'Reduce',
    unsetLabel: 'Follow system',
  };
}

const disabledControl = { kind: 'toggle', label: 'Disabled', prop: 'disabled' } as const;

function idOptions(
  items: readonly { readonly id: string; readonly label?: string }[] | undefined,
): readonly SelectOption<string>[] {
  return (items ?? []).map((item) => ({ label: item.label ?? item.id, value: item.id }));
}

function nextId(prefix: string, items: readonly { readonly id: string }[]): string {
  const taken = new Set(items.map((item) => item.id));
  let index = items.length + 1;
  while (taken.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

const spinWheel = defineGameSchema<PlaygroundPropsMap['spin-wheel']>()({
  componentName: 'SpinWheel',
  controls: [
    {
      createItem: (_index, items): WheelSegment => {
        const id = nextId('prize', items);
        return { id, label: `Prize ${items.length + 1}` };
      },
      fields: [
        { key: 'id', kind: 'text', label: 'Id' },
        { key: 'label', kind: 'text', label: 'Label', optional: true },
        { key: 'color', kind: 'color', label: 'Colour', optional: true },
        {
          key: 'weight',
          kind: 'number',
          label: 'Weight',
          max: 100,
          min: 0,
          optional: true,
          step: 1,
        },
      ],
      itemLabel: 'Segment',
      kind: 'list',
      label: 'Segments',
      maxItems: 12,
      minItems: 0,
      prop: 'segments',
    },
    { kind: 'number', label: 'Size', max: 340, min: 160, prop: 'size', step: 10, unit: 'px' },
    {
      kind: 'select',
      label: 'Direction',
      options: [
        { label: 'Clockwise', value: 'clockwise' },
        { label: 'Counter-clockwise', value: 'counter-clockwise' },
      ],
      prop: 'direction',
    },
    disabledControl,
    durationControl(animation.spinDuration),
    {
      kind: 'number',
      label: 'Rotations',
      max: 12,
      min: 0,
      optional: {
        fallback: animation.spinRotations,
        fallbackLabel: `Theme default (${animation.spinRotations})`,
      },
      prop: 'rotations',
      section: 'animation',
      step: 1,
    },
    easingControl(),
    reduceMotionControl(),
  ],
  defaults: {
    segments: [
      { id: 'points', label: '100 points' },
      { id: 'badge', label: 'Badge' },
      { id: 'bonus', label: 'Bonus' },
      { id: 'streak', label: 'Streak' },
      { id: 'sticker', label: 'Sticker' },
      { id: 'retry', label: 'Try again' },
    ],
    size: 260,
  },
  events: [
    'onReady',
    'onPlayStart',
    'onResultRequest',
    'onResultResolved',
    'onAnimationStart',
    'onRevealStart',
    'onComplete',
    'onReset',
    'onError',
    'onEvent',
    'onStatusChange',
  ],
  game: 'spin-wheel',
  libraryDefaults: { direction: 'clockwise', disabled: false, easing: LIBRARY_EASING, size: 320 },
  modes: { controlled: true, provider: true, random: true },
  outcome: {
    kind: 'choice',
    label: 'Winning segment',
    options: (values) => idOptions(values.segments),
    toSelection: (segmentId) => ({ segmentId }),
  },
  selectionType: 'SpinWheelSelection',
});

const scratchCard = defineGameSchema<PlaygroundPropsMap['scratch-card']>()({
  componentName: 'ScratchCard',
  controls: [
    { kind: 'number', label: 'Width', max: 340, min: 160, prop: 'width', step: 10, unit: 'px' },
    { kind: 'number', label: 'Height', max: 260, min: 100, prop: 'height', step: 10, unit: 'px' },
    {
      description: 'Share of the surface to scratch before the card completes.',
      kind: 'number',
      label: 'Threshold',
      max: 1,
      min: 0.05,
      prop: 'threshold',
      step: 0.05,
    },
    {
      kind: 'number',
      label: 'Brush radius',
      max: 60,
      min: 4,
      prop: 'brushRadius',
      step: 2,
      unit: 'px',
    },
    {
      kind: 'number',
      label: 'Border radius',
      max: 40,
      min: 0,
      prop: 'borderRadius',
      step: 2,
      unit: 'px',
    },
    {
      kind: 'select',
      label: 'Cover',
      options: [
        { label: 'Theme colour', value: { type: 'solid' } },
        { label: 'Silver', value: { color: '#9CA3AF', type: 'solid' } },
        { label: 'Gold', value: { color: '#C9A227', type: 'solid' } },
        { label: 'Midnight', value: { color: '#25194D', type: 'solid' } },
      ],
      prop: 'cover',
    },
    { kind: 'toggle', label: 'Reveal automatically at the threshold', prop: 'autoReveal' },
    disabledControl,
    durationControl(animation.revealDuration, 'revealDuration'),
    reduceMotionControl(),
  ],
  defaults: { height: 150, width: 270 },
  events: [
    'onReady',
    'onPlayStart',
    'onResultRequest',
    'onResultResolved',
    'onProgress',
    'onRevealStart',
    'onComplete',
    'onReset',
    'onError',
    'onEvent',
    'onStatusChange',
  ],
  game: 'scratch-card',
  libraryDefaults: {
    autoReveal: true,
    borderRadius: 16,
    brushRadius: 24,
    cover: { type: 'solid' },
    disabled: false,
    threshold: 0.65,
  },
  modeNote:
    'Scratch Card has no random mode: the prize is always supplied, either as a controlled result or by a provider.',
  modes: { controlled: true, provider: true, random: false },
  outcome: {
    initial: '250 points',
    kind: 'text',
    label: 'Prize',
    toSelection: (prize) => ({ prize }),
  },
  prizeChildren: true,
  selectionType: 'ScratchCardSelection',
});

const slotMachine = defineGameSchema<PlaygroundPropsMap['slot-machine']>()({
  componentName: 'SlotMachine',
  controls: [
    {
      createItem: (_index, items): SlotSymbol => ({ id: nextId('symbol', items), label: '💎' }),
      fields: [
        { key: 'id', kind: 'text', label: 'Id' },
        { key: 'label', kind: 'text', label: 'Label', optional: true },
        {
          key: 'weight',
          kind: 'number',
          label: 'Weight',
          max: 100,
          min: 0,
          optional: true,
          step: 1,
        },
      ],
      itemLabel: 'Symbol',
      kind: 'list',
      label: 'Symbols',
      maxItems: 8,
      minItems: 0,
      prop: 'symbols',
    },
    { kind: 'number', label: 'Reels', max: 5, min: 1, prop: 'reelCount', step: 1 },
    { kind: 'number', label: 'Rows', max: 5, min: 1, prop: 'rowCount', step: 1 },
    { kind: 'number', label: 'Width', max: 420, min: 220, prop: 'width', step: 10, unit: 'px' },
    {
      kind: 'number',
      label: 'Symbol height',
      max: 96,
      min: 40,
      prop: 'symbolHeight',
      step: 4,
      unit: 'px',
    },
    disabledControl,
    durationControl(animation.slotDuration),
    {
      kind: 'number',
      label: 'Reel delay',
      max: 600,
      min: 0,
      optional: {
        fallback: animation.slotReelDelay,
        fallbackLabel: `Theme default (${animation.slotReelDelay} ms)`,
      },
      prop: 'reelDelay',
      section: 'animation',
      step: 20,
      unit: 'ms',
    },
    easingControl(),
    reduceMotionControl(),
  ],
  defaults: {
    reelCount: 3,
    rowCount: 3,
    symbols: [
      { id: 'cherry', label: '🍒' },
      { id: 'star', label: '⭐' },
      { id: 'gift', label: '🎁' },
      { id: 'bell', label: '🔔' },
    ],
    width: 280,
  },
  events: [
    'onReady',
    'onPlayStart',
    'onResultRequest',
    'onResultResolved',
    'onAnimationStart',
    'onReelStop',
    'onRevealStart',
    'onComplete',
    'onReset',
    'onError',
    'onEvent',
    'onStatusChange',
  ],
  game: 'slot-machine',
  libraryDefaults: {
    disabled: false,
    easing: LIBRARY_EASING,
    rowCount: 3,
    symbolHeight: 64,
    width: 420,
  },
  modes: { controlled: true, provider: true, random: true },
  outcome: {
    kind: 'grid',
    label: 'Symbols on each reel',
    shape: (values) => ({
      columns: values.reelCount ?? 1,
      options: idOptions(values.symbols),
      rows: values.rowCount ?? 3,
    }),
    toSelection: (reels) => ({ reels }),
  },
  selectionType: 'SlotMachineSelection',
});

const bingoPatterns = [
  { label: 'Row', value: 'row' },
  { label: 'Column', value: 'column' },
  { label: 'Diagonal', value: 'diagonal' },
  { label: 'Four corners', value: 'four-corners' },
  { label: 'Full board', value: 'full-board' },
] as const satisfies readonly SelectOption<BingoPattern>[];

const bingo = defineGameSchema<PlaygroundPropsMap['bingo']>()({
  componentName: 'Bingo',
  controls: [
    { kind: 'number', label: 'Card size', max: 5, min: 3, prop: 'size', step: 1 },
    { kind: 'number', label: 'Lowest number', max: 50, min: 1, prop: 'minNumber', step: 1 },
    { kind: 'number', label: 'Highest number', max: 99, min: 9, prop: 'maxNumber', step: 1 },
    { kind: 'toggle', label: 'Free centre space', prop: 'freeSpace' },
    { kind: 'multi', label: 'Winning patterns', options: bingoPatterns, prop: 'patterns' },
    { kind: 'number', label: 'Width', max: 480, min: 220, prop: 'width', step: 10, unit: 'px' },
    { kind: 'number', label: 'Cell gap', max: 16, min: 0, prop: 'cellGap', step: 1, unit: 'px' },
    { kind: 'toggle', label: 'Show call button', prop: 'showCallButton' },
    disabledControl,
    reduceMotionControl(),
  ],
  defaults: { maxNumber: 30, size: 3, width: 280 },
  events: [
    'onReady',
    'onCall',
    'onMark',
    'onUnmark',
    'onComplete',
    'onReset',
    'onError',
    'onEvent',
    'onStatusChange',
  ],
  game: 'bingo',
  libraryDefaults: {
    cellGap: 6,
    disabled: false,
    freeSpace: true,
    maxNumber: DEFAULT_BINGO_MAX_NUMBER,
    minNumber: DEFAULT_BINGO_MIN_NUMBER,
    patterns: DEFAULT_BINGO_PATTERNS,
    showCallButton: true,
    size: DEFAULT_BINGO_SIZE,
    width: 480,
  },
  modeNote:
    'Bingo draws calls locally and has no result provider. A seed makes the card and the draw order repeatable; for server-driven calls, pass `board` and call `call(number)` on the ref.',
  modes: { controlled: false, provider: false, random: true },
});

const diceSides = [4, 6, 8, 10, 12, 20].map((sides) => ({ label: `D${sides}`, value: sides }));

const dice = defineGameSchema<PlaygroundPropsMap['dice']>()({
  componentName: 'Dice',
  controls: [
    { kind: 'number', label: 'Dice', max: 6, min: 1, prop: 'count', step: 1 },
    { kind: 'select', label: 'Sides', options: diceSides, prop: 'sides' },
    {
      kind: 'select',
      label: 'Face style',
      options: [
        { label: 'Numbers', value: 'numbers' },
        { label: 'Pips (D6)', value: 'pips' },
      ],
      prop: 'faceStyle',
    },
    { kind: 'number', label: 'Width', max: 400, min: 200, prop: 'width', step: 10, unit: 'px' },
    disabledControl,
    durationControl(animation.diceRollDuration),
    easingControl(),
    reduceMotionControl(),
  ],
  defaults: { count: 2, faceStyle: 'pips', width: 260 },
  events: [
    'onReady',
    'onPlayStart',
    'onResultRequest',
    'onResultResolved',
    'onAnimationStart',
    'onRevealStart',
    'onComplete',
    'onReset',
    'onError',
    'onEvent',
    'onStatusChange',
  ],
  game: 'dice',
  libraryDefaults: {
    count: 1,
    disabled: false,
    easing: LIBRARY_EASING,
    faceStyle: 'numbers',
    sides: 6,
    width: 360,
  },
  modes: { controlled: true, provider: true, random: true },
  outcome: {
    items: (values) =>
      Array.from({ length: values.count ?? 1 }, (_, index) => ({
        label: `Die ${index + 1}`,
        max: values.sides ?? 6,
      })),
    kind: 'numbers',
    label: 'Die values',
    toSelection: (values) => ({ values }),
  },
  selectionType: 'DiceSelection',
});

const coinFlip = defineGameSchema<PlaygroundPropsMap['coin-flip']>()({
  componentName: 'CoinFlip',
  controls: [
    {
      createItem: (_index, items): CoinFace => ({ id: nextId('face', items) }),
      description: 'A coin has exactly two faces; the library rejects any other count.',
      fields: [
        { key: 'id', kind: 'text', label: 'Id' },
        { key: 'label', kind: 'text', label: 'Label', optional: true },
      ],
      itemLabel: 'Face',
      kind: 'list',
      label: 'Faces',
      maxItems: 2,
      minItems: 2,
      prop: 'faces',
    },
    {
      kind: 'select',
      label: 'Face style',
      options: [
        { label: 'Flat', value: 'flat' },
        { label: 'Embossed', value: 'embossed' },
      ],
      prop: 'faceStyle',
    },
    { kind: 'number', label: 'Size', max: 220, min: 80, prop: 'size', step: 4, unit: 'px' },
    disabledControl,
    durationControl(animation.coinFlipDuration),
    easingControl(),
    reduceMotionControl(),
  ],
  defaults: {
    faceStyle: 'embossed',
    size: 132,
  },
  events: [
    'onReady',
    'onPlayStart',
    'onResultRequest',
    'onResultResolved',
    'onAnimationStart',
    'onRevealStart',
    'onComplete',
    'onReset',
    'onError',
    'onEvent',
    'onStatusChange',
  ],
  game: 'coin-flip',
  libraryDefaults: {
    disabled: false,
    easing: LIBRARY_EASING,
    faceStyle: 'flat',
    faces: DEFAULT_COIN_FACES,
    size: 160,
  },
  modes: { controlled: true, provider: true, random: true },
  outcome: {
    kind: 'choice',
    label: 'Winning face',
    options: (values) => idOptions(values.faces ?? DEFAULT_COIN_FACES),
    toSelection: (faceId) => ({ faceId }),
  },
  selectionType: 'CoinFlipSelection',
});

const luckyBox = defineGameSchema<PlaygroundPropsMap['lucky-box']>()({
  componentName: 'LuckyBox',
  controls: [
    {
      createItem: (_index, items): LuckyBoxItem => ({
        id: nextId('box', items),
        label: `Box ${items.length + 1}`,
      }),
      fields: [
        { key: 'id', kind: 'text', label: 'Id' },
        { key: 'label', kind: 'text', label: 'Label', optional: true },
        { key: 'disabled', kind: 'toggle', label: 'Unavailable' },
      ],
      itemLabel: 'Box',
      kind: 'list',
      label: 'Boxes',
      maxItems: 9,
      minItems: 0,
      prop: 'boxes',
    },
    { kind: 'number', label: 'Columns', max: 4, min: 1, prop: 'columns', step: 1 },
    {
      kind: 'select',
      label: 'Face style',
      options: [
        { label: 'Tiles', value: 'tiles' },
        { label: 'Gift boxes', value: 'gift-boxes' },
      ],
      prop: 'faceStyle',
    },
    { kind: 'number', label: 'Width', max: 420, min: 220, prop: 'width', step: 10, unit: 'px' },
    disabledControl,
    durationControl(animation.luckyBoxRevealDuration),
    easingControl(),
    reduceMotionControl(),
  ],
  defaults: {
    boxes: [
      { id: 'violet', label: 'Violet' },
      { id: 'gold', label: 'Gold' },
      { id: 'mint', label: 'Mint' },
    ],
    columns: 3,
    faceStyle: 'gift-boxes',
    width: 280,
  },
  events: [
    'onReady',
    'onSelect',
    'onPlayStart',
    'onResultRequest',
    'onResultResolved',
    'onAnimationStart',
    'onRevealStart',
    'onComplete',
    'onReset',
    'onError',
    'onEvent',
    'onStatusChange',
  ],
  game: 'lucky-box',
  libraryDefaults: {
    columns: 3,
    disabled: false,
    easing: LIBRARY_EASING,
    faceStyle: 'tiles',
    width: 420,
  },
  modeNote: 'Pick a box, then reveal it. The result decides which box wins.',
  modes: { controlled: true, provider: true, random: true },
  outcome: {
    kind: 'choice',
    label: 'Winning box',
    options: (values) => idOptions(values.boxes),
    toSelection: (boxId) => ({ boxId }),
  },
  selectionType: 'LuckyBoxSelection',
});

const typedSchemas = {
  bingo,
  'coin-flip': coinFlip,
  dice,
  'lucky-box': luckyBox,
  'scratch-card': scratchCard,
  'slot-machine': slotMachine,
  'spin-wheel': spinWheel,
} satisfies { readonly [K in GameId]: GameSchema<PlaygroundPropsMap[K]> };

/** The per-game schemas, erased to the plain shape the playground UI consumes. */
export const playgroundSchemas: Readonly<Record<GameId, ErasedSchema>> = {
  bingo: eraseSchema(typedSchemas.bingo),
  'coin-flip': eraseSchema(typedSchemas['coin-flip']),
  dice: eraseSchema(typedSchemas.dice),
  'lucky-box': eraseSchema(typedSchemas['lucky-box']),
  'scratch-card': eraseSchema(typedSchemas['scratch-card']),
  'slot-machine': eraseSchema(typedSchemas['slot-machine']),
  'spin-wheel': eraseSchema(typedSchemas['spin-wheel']),
};
