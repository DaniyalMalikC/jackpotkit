/* global jest */

jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  const identity = (value) => value;

  return {
    __esModule: true,
    default: {
      createAnimatedComponent: identity,
      View,
    },
    Easing: {
      cubic: identity,
      out: identity,
    },
    cancelAnimation: jest.fn(),
    runOnJS: identity,
    useAnimatedStyle: (updater) => updater(),
    useReducedMotion: () => false,
    useSharedValue: (value) => ({ value }),
    withTiming: (value, _configuration, callback) => {
      callback?.(true);
      return value;
    },
  };
});
