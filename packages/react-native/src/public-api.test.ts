import * as reactNative from './index';

describe('@jackpotkit/react-native public entrypoint', () => {
  it('exposes the intentional Phase 2 runtime API', () => {
    expect(Object.keys(reactNative).sort()).toEqual(
      ['JackpotKitProvider', 'SpinWheel', 'useJackpotKitTheme', 'useSpinWheel'].sort(),
    );
  });
});
