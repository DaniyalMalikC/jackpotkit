import * as slotMachine from './index';

describe('@jackpotkit/react-native/slot-machine public entrypoint', () => {
  it('exposes only the intentional Slot Machine runtime API', () => {
    expect(Object.keys(slotMachine).sort()).toEqual(['SlotMachine', 'useSlotMachine']);
  });
});
