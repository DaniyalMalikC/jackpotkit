export interface GalleryGame {
  readonly description: string;
  readonly emoji: string;
  readonly milestone: string;
  readonly name: string;
}

export const galleryGames: readonly GalleryGame[] = [
  {
    description: 'The reference game for result-driven animation and customization.',
    emoji: '🎡',
    milestone: 'Phase 2',
    name: 'Spin Wheel',
  },
  {
    description: 'Gesture-based reveal mechanics with isolated graphics dependencies.',
    emoji: '🎟️',
    milestone: 'Phase 3',
    name: 'Scratch Card',
  },
  {
    description: 'Deterministic reels, paylines, and server-controlled destinations.',
    emoji: '🎰',
    milestone: 'Phase 4',
    name: 'Slot Machine',
  },
  {
    description: 'Headless board generation, calling, marking, and pattern detection.',
    emoji: '🔢',
    milestone: 'Phase 5',
    name: 'Bingo',
  },
  {
    description: 'Generic multi-die rolls supporting standard and custom side counts.',
    emoji: '🎲',
    milestone: 'Phase 6',
    name: 'Dice',
  },
  {
    description: 'A two-sided controlled or random reveal with customizable faces.',
    emoji: '🪙',
    milestone: 'Phase 6',
    name: 'Coin Flip',
  },
  {
    description: 'Reusable pick-and-reveal mechanics for boxes, doors, and gifts.',
    emoji: '🎁',
    milestone: 'Phase 6',
    name: 'Lucky Box',
  },
];
