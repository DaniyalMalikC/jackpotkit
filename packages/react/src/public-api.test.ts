import { describe, expect, it } from 'vitest';

import * as bingo from './bingo/index.js';
import * as coinFlip from './coin-flip/index.js';
import * as dice from './dice/index.js';
import * as jackpotReact from './index.js';
import * as luckyBox from './lucky-box/index.js';
import * as scratchCard from './scratch-card/index.js';
import * as slotMachine from './slot-machine/index.js';
import * as spinWheel from './spin-wheel/index.js';

describe('@jackpotkit/react public API', () => {
  it('exposes all seven web renderers and their hooks from the root', () => {
    expect(Object.keys(jackpotReact).sort()).toEqual(
      [
        'Bingo',
        'CoinFlip',
        'Dice',
        'JackpotKitProvider',
        'LuckyBox',
        'ScratchCard',
        'SlotMachine',
        'SpinWheel',
        'useBingo',
        'useCoinFlip',
        'useDice',
        'useJackpotKitTheme',
        'useLuckyBox',
        'useScratchCard',
        'useSlotMachine',
        'useSpinWheel',
      ].sort(),
    );
  });

  it.each([
    ['spin-wheel', spinWheel, ['SpinWheel', 'useSpinWheel']],
    ['dice', dice, ['Dice', 'useDice']],
    ['coin-flip', coinFlip, ['CoinFlip', 'useCoinFlip']],
    ['lucky-box', luckyBox, ['LuckyBox', 'useLuckyBox']],
    ['slot-machine', slotMachine, ['SlotMachine', 'useSlotMachine']],
    ['scratch-card', scratchCard, ['ScratchCard', 'useScratchCard']],
    ['bingo', bingo, ['Bingo', 'useBingo']],
  ])('keeps the %s runtime entrypoint exact', (_name, module, names) => {
    expect(Object.keys(module).sort()).toEqual(names.sort());
  });
});
