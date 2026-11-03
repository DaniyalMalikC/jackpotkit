import type { ComponentType } from 'react';

import BingoPlayground from './bingo-playground';
import { CoinFlipPlayground, DicePlayground, LuckyBoxPlayground } from './phase-six-playgrounds';
import ScratchCardRouteContent from './scratch-card-route-content';
import SlotMachinePlayground from './slot-machine-playground';
import { SpinWheelPlayground } from './spin-wheel-playground';

export const gameSlugs = [
  'spin-wheel',
  'scratch-card',
  'slot-machine',
  'bingo',
  'dice',
  'coin-flip',
  'lucky-box',
] as const;

/**
 * Embed surface: the documentation site's cream (#FFFDD0), so the iframe blends with the docs
 * palette. Only the embed route uses it; the gallery keeps its own background. The playgrounds draw
 * light cards with dark text, so a transparent frame would put that text on a dark host page.
 */
export const embedBackground = '#FFFDD0';

export type GameSlug = (typeof gameSlugs)[number];

export interface GamePlayground {
  readonly title: string;
  readonly Playground: ComponentType;
}

/**
 * Every game's gallery playground, keyed by its route slug. The embed route renders these without
 * the gallery chrome. Scratch Card goes through its route content so web loads CanvasKit first.
 */
export const gamePlaygrounds: Readonly<Record<GameSlug, GamePlayground>> = {
  bingo: { Playground: BingoPlayground, title: 'Bingo' },
  'coin-flip': { Playground: CoinFlipPlayground, title: 'Coin Flip' },
  dice: { Playground: DicePlayground, title: 'Dice' },
  'lucky-box': { Playground: LuckyBoxPlayground, title: 'Lucky Box' },
  'scratch-card': { Playground: ScratchCardRouteContent, title: 'Scratch Card' },
  'slot-machine': { Playground: SlotMachinePlayground, title: 'Slot Machine' },
  'spin-wheel': { Playground: SpinWheelPlayground, title: 'Spin Wheel' },
};

export function isGameSlug(value: unknown): value is GameSlug {
  return typeof value === 'string' && (gameSlugs as readonly string[]).includes(value);
}
