import * as luckyBox from './index';

describe('@jackpotkit/react-native/lucky-box public entrypoint', () => {
  it('exposes only the intentional Lucky Box runtime API', () => {
    expect(Object.keys(luckyBox).sort()).toEqual(['LuckyBox', 'useLuckyBox']);
  });
});
