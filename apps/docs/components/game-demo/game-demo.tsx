'use client';

import type { JackpotThemeOverride } from '@jackpotkit/theme';
import { Bingo } from '@jackpotkit/react/bingo';
import { CoinFlip } from '@jackpotkit/react/coin-flip';
import { Dice } from '@jackpotkit/react/dice';
import { LuckyBox } from '@jackpotkit/react/lucky-box';
import { ScratchCard } from '@jackpotkit/react/scratch-card';
import { SlotMachine } from '@jackpotkit/react/slot-machine';
import { SpinWheel } from '@jackpotkit/react/spin-wheel';
import type { ReactNode } from 'react';

import { useIsClient } from '@/components/use-client';
import { useDemoTheme } from '@/components/use-demo-theme';
import { games, type GameId } from '@/lib/games';

import { gameDemoDefaults, type GameDemoPropsMap } from './default-props';

type GameDemoVariant = {
  readonly [K in GameId]: {
    /** Which game to render. */
    readonly game: K;
    /** Overrides merged over the defaults in `default-props.tsx`. */
    readonly props?: Partial<GameDemoPropsMap[K]>;
  };
}[GameId];

export type GameDemoProps = GameDemoVariant & {
  /** Caption shown under the demo. Defaults to a description of the rendered package. */
  readonly caption?: ReactNode;
};

function merge<K extends GameId>(
  game: K,
  theme: JackpotThemeOverride,
  overrides: Partial<GameDemoPropsMap[K]> | undefined,
): GameDemoPropsMap[K] {
  return {
    ...(gameDemoDefaults[game] as GameDemoPropsMap[K]),
    theme,
    ...overrides,
  };
}

function renderGame(demo: GameDemoVariant, theme: JackpotThemeOverride) {
  switch (demo.game) {
    case 'spin-wheel':
      return <SpinWheel {...merge(demo.game, theme, demo.props)} />;
    case 'scratch-card':
      return <ScratchCard {...merge(demo.game, theme, demo.props)} />;
    case 'slot-machine':
      return <SlotMachine {...merge(demo.game, theme, demo.props)} />;
    case 'bingo':
      return <Bingo {...merge(demo.game, theme, demo.props)} />;
    case 'dice':
      return <Dice {...merge(demo.game, theme, demo.props)} />;
    case 'coin-flip':
      return <CoinFlip {...merge(demo.game, theme, demo.props)} />;
    case 'lucky-box':
      return <LuckyBox {...merge(demo.game, theme, demo.props)} />;
  }
}

/**
 * Renders the real `@jackpotkit/react` component for a game. Rendering waits until the browser has
 * mounted, because some games (for example Bingo card generation) draw from client randomness
 * that would otherwise differ between the server and the browser.
 */
export function GameDemo({ caption, ...demo }: GameDemoProps) {
  const isClient = useIsClient();
  const theme = useDemoTheme();
  const name = games.find((game) => game.id === demo.game)?.name ?? demo.game;

  return (
    <figure
      className="not-prose my-6 overflow-hidden rounded-xl border bg-fd-card"
      data-game-demo={demo.game}
    >
      <div className="jk-demo-surface flex min-h-[320px] items-center justify-center overflow-x-auto p-6">
        {isClient ? (
          renderGame(demo as GameDemoVariant, theme)
        ) : (
          <p className="text-sm text-fd-muted-foreground">Loading {name} preview…</p>
        )}
      </div>
      <figcaption className="border-t px-4 py-3 text-sm text-fd-muted-foreground">
        {caption ?? (
          <>
            Live preview of the <code>{name}</code> component from{' '}
            <code>@jackpotkit/react/{demo.game}</code>, using client randomness. React Native uses
            the equivalent component from <code>@jackpotkit/react-native/{demo.game}</code>.
          </>
        )}
      </figcaption>
    </figure>
  );
}
