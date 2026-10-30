import type { GameId } from '@/lib/games';

const paths: Record<GameId, React.ReactNode> = {
  'spin-wheel': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
    </>
  ),
  'scratch-card': (
    <>
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="M6 15c2-3 4 1 6-2s4 1 6-2" />
    </>
  ),
  'slot-machine': (
    <>
      <rect height="14" rx="2" width="18" x="3" y="5" />
      <path d="M9 5v14M15 5v14M3 12h18" />
    </>
  ),
  bingo: (
    <>
      <rect height="18" rx="2" width="18" x="3" y="3" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </>
  ),
  dice: (
    <>
      <rect height="16" rx="3" width="16" x="4" y="4" />
      <circle cx="9" cy="9" r="1" />
      <circle cx="15" cy="15" r="1" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  'coin-flip': (
    <>
      <ellipse cx="12" cy="12" rx="9" ry="9" />
      <ellipse cx="12" cy="12" rx="5" ry="5" />
    </>
  ),
  'lucky-box': (
    <>
      <rect height="11" rx="1" width="16" x="4" y="10" />
      <path d="M3 7h18v3H3zM12 7v14M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0" />
    </>
  ),
};

export function GameIcon({ game }: { readonly game: GameId }) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      {paths[game]}
    </svg>
  );
}
