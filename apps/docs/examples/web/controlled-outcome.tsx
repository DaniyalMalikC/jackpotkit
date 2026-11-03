import { SlotMachine, type SlotMachineRef } from '@jackpotkit/react/slot-machine';
import { SpinWheel, type SpinWheelRef } from '@jackpotkit/react/spin-wheel';
import { useRef } from 'react';

const segments = [
  { id: 'red', label: 'Red' },
  { id: 'blue', label: 'Blue' },
];
const symbols = [
  { id: 'cherry', label: 'Cherry' },
  { id: 'star', label: 'Star' },
];

// #region prop
// Declarative: the next spin always lands on the segment the application chose.
export function NextSegment({ segmentId }: { readonly segmentId: string }) {
  return <SpinWheel segments={segments} result={{ segmentId }} />;
}
// #endregion prop

// #region ref
// Imperative: choose the destination at the moment of play.
export function TutorialWheel() {
  const wheel = useRef<SpinWheelRef>(null);
  const machine = useRef<SlotMachineRef>(null);

  async function playScript() {
    await wheel.current?.spinTo('blue');
    await machine.current?.spinTo({ reels: [['star'], ['star'], ['star']] });
  }

  return (
    <>
      <SpinWheel ref={wheel} segments={segments} />
      <SlotMachine ref={machine} symbols={symbols} reelCount={3} rowCount={1} />
      <button type="button" onClick={() => void playScript()}>
        Show me how it works
      </button>
    </>
  );
}
// #endregion ref
