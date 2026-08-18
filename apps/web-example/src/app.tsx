import { Bingo } from '@jackpotkit/react/bingo';
import { CoinFlip } from '@jackpotkit/react/coin-flip';
import { Dice } from '@jackpotkit/react/dice';
import { LuckyBox } from '@jackpotkit/react/lucky-box';
import { ScratchCard } from '@jackpotkit/react/scratch-card';
import { SlotMachine } from '@jackpotkit/react/slot-machine';
import { SpinWheel } from '@jackpotkit/react/spin-wheel';

const segments = [
  { id: 'points', label: '100 points', color: '#6843D5' },
  { id: 'badge', label: 'Badge', color: '#EB4D8A' },
  { id: 'bonus', label: 'Bonus', color: '#18A999' },
];
const symbols = [
  { id: 'cherry', label: '🍒' },
  { id: 'star', label: '⭐' },
  { id: 'gift', label: '🎁' },
];
const boxes = [
  { id: 'violet', label: 'Violet' },
  { id: 'gold', label: 'Gold' },
  { id: 'mint', label: 'Mint' },
];

export function App() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">PHASE 7 · REACT WEB RENDERERS</p>
        <h1>Seven game experiences. Zero native assumptions.</h1>
        <p className="lede">
          Every result is resolved by <code>@jackpotkit/core</code>. React renders accessible web
          controls with SVG, Canvas, Pointer Events, and transform-based motion.
        </p>
      </section>

      <section aria-labelledby="gallery-title" className="gallery-section">
        <div className="section-heading">
          <p className="section-label">Interactive package smoke test</p>
          <h2 id="gallery-title">React renderer gallery</h2>
        </div>
        <div className="game-grid">
          <article className="game-card game-card-wide">
            <h3>Spin Wheel</h3>
            <SpinWheel segments={segments} size={250} />
          </article>
          <article className="game-card">
            <h3>Dice</h3>
            <Dice count={2} width={260} />
          </article>
          <article className="game-card">
            <h3>Coin Flip</h3>
            <CoinFlip size={132} />
          </article>
          <article className="game-card">
            <h3>Lucky Box</h3>
            <LuckyBox boxes={boxes} columns={3} width={300} />
          </article>
          <article className="game-card game-card-wide">
            <h3>Slot Machine</h3>
            <SlotMachine reelCount={3} rowCount={2} symbols={symbols} width={380} />
          </article>
          <article className="game-card">
            <h3>Scratch Card</h3>
            <ScratchCard height={150} result={{ prize: '250 points' }} width={270}>
              <div className="prize">250 points</div>
            </ScratchCard>
          </article>
          <article className="game-card game-card-bingo">
            <h3>Bingo</h3>
            <Bingo size={3} maxNumber={30} width={300} />
          </article>
        </div>
      </section>

      <p className="authority-note">
        Client randomness is for ordinary gamification and previews. Valuable outcomes must be
        selected and persisted by an authoritative server.
      </p>
    </main>
  );
}
