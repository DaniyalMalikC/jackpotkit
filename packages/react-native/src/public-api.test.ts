import * as reactNative from './index';

describe('@jackpotkit/react-native public entrypoint', () => {
  it('keeps the root runtime API free of optional heavy renderers', () => {
    expect(Object.keys(reactNative).sort()).toEqual(
      [
        'Bingo',
        'JackpotKitProvider',
        'SlotMachine',
        'SpinWheel',
        'useJackpotKitTheme',
        'useBingo',
        'useSlotMachine',
        'useSpinWheel',
      ].sort(),
    );
  });
});
