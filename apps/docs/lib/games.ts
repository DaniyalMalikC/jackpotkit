export const gameIds = [
  'spin-wheel',
  'scratch-card',
  'slot-machine',
  'bingo',
  'dice',
  'coin-flip',
  'lucky-box',
] as const;

export type GameId = (typeof gameIds)[number];

export interface GameInfo {
  readonly id: GameId;
  readonly name: string;
  readonly summary: string;
}

export const games: readonly GameInfo[] = [
  {
    id: 'spin-wheel',
    name: 'Spin Wheel',
    summary: 'Weighted segments, equal slices, and an exact stopping angle.',
  },
  {
    id: 'scratch-card',
    name: 'Scratch Card',
    summary: 'Reveal a known prize with pointer or touch scratching.',
  },
  {
    id: 'slot-machine',
    name: 'Slot Machine',
    summary: 'A resolved symbol grid, staggered reels, and paylines.',
  },
  { id: 'bingo', name: 'Bingo', summary: 'Generated cards, calls, marks, and pattern checks.' },
  { id: 'dice', name: 'Dice', summary: 'D4 to D20, custom sides, and mixed dice.' },
  {
    id: 'coin-flip',
    name: 'Coin Flip',
    summary: 'Two configurable faces with controlled results.',
  },
  {
    id: 'lucky-box',
    name: 'Lucky Box',
    summary: 'Pick-and-reveal boxes, gifts, doors, or envelopes.',
  },
];
