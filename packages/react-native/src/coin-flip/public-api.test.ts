import * as coinFlip from './index';

describe('@jackpotkit/react-native/coin-flip public entrypoint', () => {
  it('exposes only the intentional Coin Flip runtime API', () => {
    expect(Object.keys(coinFlip).sort()).toEqual(['CoinFlip', 'useCoinFlip']);
  });
});
