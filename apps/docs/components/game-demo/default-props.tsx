import type { BingoProps } from '@jackpotkit/react/bingo';
import type { CoinFlipProps } from '@jackpotkit/react/coin-flip';
import type { Dice } from '@jackpotkit/react/dice';
import type { LuckyBoxProps } from '@jackpotkit/react/lucky-box';
import type { ScratchCardProps } from '@jackpotkit/react/scratch-card';
import type { SlotMachineProps } from '@jackpotkit/react/slot-machine';
import type { SpinWheelProps } from '@jackpotkit/react/spin-wheel';
import type { ComponentProps } from 'react';

import type { GameId } from '@/lib/games';

/** Props accepted by each game's `@jackpotkit/react` component, keyed by game id. */
export interface GameDemoPropsMap {
  readonly 'spin-wheel': SpinWheelProps;
  readonly 'scratch-card': ScratchCardProps;
  readonly 'slot-machine': SlotMachineProps;
  readonly bingo: BingoProps;
  // `Dice` is exported as `forwardRef(DiceInner)` without the generic cast the other games use, so
  // it accepts `DiceProps<unknown>` rather than `DiceProps` (`TRequest = void`). Read the props
  // from the component itself so the demo matches what it really accepts.
  readonly dice: Omit<ComponentProps<typeof Dice>, 'ref'>;
  readonly 'coin-flip': CoinFlipProps;
  readonly 'lucky-box': LuckyBoxProps;
}

/**
 * Default props for each embedded demo. Every value uses a documented public prop; sizes are kept
 * at or below 300px so the demos fit a 390px phone viewport.
 */
export const gameDemoDefaults = {
  'spin-wheel': {
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
  'scratch-card': {
    children: (
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          fontSize: 24,
          fontWeight: 800,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        250 points
      </div>
    ),
    height: 150,
    result: { prize: '250 points' },
    width: 270,
  },
  'slot-machine': {
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
  bingo: {
    maxNumber: 30,
    size: 3,
    width: 280,
  },
  dice: {
    count: 2,
    faceStyle: 'pips',
    width: 260,
  },
  'coin-flip': {
    faceStyle: 'embossed',
    size: 132,
  },
  'lucky-box': {
    boxes: [
      { id: 'violet', label: 'Violet' },
      { id: 'gold', label: 'Gold' },
      { id: 'mint', label: 'Mint' },
    ],
    columns: 3,
    faceStyle: 'gift-boxes',
    width: 280,
  },
} satisfies { readonly [K in GameId]: GameDemoPropsMap[K] };
