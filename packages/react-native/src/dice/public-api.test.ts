import * as dice from './index';

describe('@jackpotkit/react-native/dice public entrypoint', () => {
  it('exposes only the intentional Dice runtime API', () => {
    expect(Object.keys(dice).sort()).toEqual(['Dice', 'useDice']);
  });
});
