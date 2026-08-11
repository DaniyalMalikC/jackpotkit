import * as bingo from './index';

describe('@jackpotkit/react-native/bingo public entrypoint', () => {
  it('exposes only the intentional Bingo runtime API', () => {
    expect(Object.keys(bingo).sort()).toEqual(['Bingo', 'useBingo'].sort());
  });
});
