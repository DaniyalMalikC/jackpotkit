/* global jest */

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('react-native-gesture-handler/jestSetup');

jest.mock('@shopify/react-native-skia', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const Canvas = ({ children, style }) => React.createElement(View, { style }, children);
  const Group = ({ children }) => React.createElement(React.Fragment, null, children);
  const Empty = () => null;

  return {
    Canvas,
    Group,
    Image: Empty,
    Paint: Empty,
    Path: Empty,
    RoundedRect: Empty,
    Skia: {
      PathBuilder: {
        Make: () => {
          const builder = {
            build: () => ({ __typename__: 'Path' }),
            lineTo: () => builder,
            moveTo: () => builder,
          };
          return builder;
        },
      },
    },
    useImage: () => null,
  };
});

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
    interpolate: (value, input, output) => {
      if (value <= input[0]) return output[0];
      for (let index = 1; index < input.length; index += 1) {
        if (value <= input[index]) {
          const progress = (value - input[index - 1]) / (input[index] - input[index - 1]);
          return output[index - 1] + (output[index] - output[index - 1]) * progress;
        }
      }
      return output[output.length - 1];
    },
    runOnJS: identity,
    useAnimatedStyle: (updater) => updater(),
    useEvent: (callback) => callback,
    useReducedMotion: () => false,
    useSharedValue: (value) => ({
      value,
      set(nextValue) {
        this.value = typeof nextValue === 'function' ? nextValue(this.value) : nextValue;
      },
    }),
    withTiming: (value, _configuration, callback) => {
      callback?.(true);
      return value;
    },
    withDelay: (_delay, animation) => animation,
  };
});
