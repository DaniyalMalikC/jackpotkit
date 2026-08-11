import * as scratchCard from './index';

describe('@jackpotkit/react-native/scratch-card public entrypoint', () => {
  it('exposes only the isolated Phase 3 Scratch Card runtime API', () => {
    expect(Object.keys(scratchCard).sort()).toEqual(['ScratchCard', 'useScratchCard'].sort());
  });
});
