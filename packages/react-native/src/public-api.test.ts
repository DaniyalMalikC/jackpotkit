import * as reactNative from './index';

describe('@jackpotkit/react-native public entrypoint', () => {
  it('keeps the root runtime API free of optional game renderers', () => {
    expect(Object.keys(reactNative).sort()).toEqual(
      ['JackpotKitProvider', 'SpinWheel', 'useJackpotKitTheme', 'useSpinWheel'].sort(),
    );
  });
});
