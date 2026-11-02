import { SlotMachine } from '@jackpotkit/react/slot-machine';
import { createSlotSymbols } from '@jackpotkit/testing';

/**
 * Layout fixtures rendered only when the gallery URL carries `?fixture=<name>`. They exist for the
 * browser end-to-end suite (`apps/e2e`) and are not linked from the gallery.
 */
const labelledSymbols = createSlotSymbols(4);

const slotLabelLayouts = [
  { reelCount: 3, width: 380 },
  { reelCount: 5, width: 320 },
] as const;

function SlotLabelFixture() {
  return (
    <main className="fixture">
      <h1>Slot Machine text labels</h1>
      {slotLabelLayouts.map(({ reelCount, width }) => (
        <section
          data-fixture-layout={`${reelCount}x${width}`}
          key={`${reelCount}x${width}`}
          style={{ width }}
        >
          <h2>
            {reelCount} reels, {width}px
          </h2>
          <SlotMachine
            accessibilityLabel={`Slot Machine ${reelCount} reels ${width}px`}
            reelCount={reelCount}
            rowCount={3}
            symbols={labelledSymbols}
            width={width}
          />
        </section>
      ))}
    </main>
  );
}

const fixtures: Readonly<Record<string, () => React.JSX.Element>> = {
  'slot-labels': SlotLabelFixture,
};

export function resolveFixture(search: string): (() => React.JSX.Element) | undefined {
  const name = new URLSearchParams(search).get('fixture');
  return name === null ? undefined : fixtures[name];
}
