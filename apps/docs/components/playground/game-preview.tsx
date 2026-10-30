'use client';

import type { ScratchCardResult } from '@jackpotkit/core';
import { Bingo } from '@jackpotkit/react/bingo';
import { CoinFlip } from '@jackpotkit/react/coin-flip';
import { Dice } from '@jackpotkit/react/dice';
import { LuckyBox } from '@jackpotkit/react/lucky-box';
import { ScratchCard } from '@jackpotkit/react/scratch-card';
import { SlotMachine } from '@jackpotkit/react/slot-machine';
import { SpinWheel } from '@jackpotkit/react/spin-wheel';

import type { GameId } from '@/lib/games';
import type { PlaygroundPropsMap } from '@/lib/playground/games';

/** The imperative surface every game ref shares. */
export interface ResettableGame {
  reset(): unknown;
}

export type GameRef = (instance: ResettableGame | null) => void;

/** Matches the children the generated Scratch Card code renders. */
function renderPrize(result: ScratchCardResult | undefined) {
  return (
    <strong style={{ fontSize: 24 }}>{result === undefined ? '' : String(result.prize)}</strong>
  );
}

/**
 * Renders the real `@jackpotkit/react` component. `props` were built from the game's typed schema,
 * so the per-game casts only restore the type the schema already checked.
 */
export function GamePreview({
  game,
  gameRef,
  props,
}: {
  readonly game: GameId;
  readonly gameRef: GameRef;
  readonly props: Readonly<Record<string, unknown>>;
}) {
  switch (game) {
    case 'spin-wheel':
      return <SpinWheel {...(props as PlaygroundPropsMap['spin-wheel'])} ref={gameRef} />;
    case 'scratch-card':
      return (
        <ScratchCard
          {...(props as Omit<PlaygroundPropsMap['scratch-card'], 'children'>)}
          ref={gameRef}
        >
          {renderPrize}
        </ScratchCard>
      );
    case 'slot-machine':
      return <SlotMachine {...(props as PlaygroundPropsMap['slot-machine'])} ref={gameRef} />;
    case 'bingo':
      return <Bingo {...(props as PlaygroundPropsMap['bingo'])} ref={gameRef} />;
    case 'dice':
      return <Dice {...(props as PlaygroundPropsMap['dice'])} ref={gameRef} />;
    case 'coin-flip':
      return <CoinFlip {...(props as PlaygroundPropsMap['coin-flip'])} ref={gameRef} />;
    case 'lucky-box':
      return <LuckyBox {...(props as PlaygroundPropsMap['lucky-box'])} ref={gameRef} />;
  }
}
