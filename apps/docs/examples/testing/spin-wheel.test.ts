import { SeededRandomSource } from '@jackpotkit/core';
import { createSpinWheel } from '@jackpotkit/core/spin-wheel';
import { createWheelSegments, MockResultProvider, SequenceRandomSource } from '@jackpotkit/testing';
import { describe, expect, it } from 'vitest';

const segments = createWheelSegments(4);

describe('daily spin rules', () => {
  // #region sequence
  it('picks the segment for an exact random value', () => {
    // 0.9 falls in the last of four equal-weight segments.
    const wheel = createSpinWheel({ randomSource: new SequenceRandomSource([0.9]), segments });
    expect(wheel.spin().segmentId).toBe('segment-4');
  });
  // #endregion sequence

  // #region seeded
  it('repeats the same sequence for the same seed', () => {
    const spin = () =>
      createSpinWheel({ randomSource: new SeededRandomSource('review-1'), segments }).spin()
        .segmentId;
    expect(spin()).toBe(spin());
  });
  // #endregion seeded

  // #region provider
  it('uses the server result and records the request', async () => {
    const provider = new MockResultProvider<{ campaignId: string }, { segmentId: string }>({
      result: { segmentId: 'segment-2' },
    });
    const wheel = createSpinWheel({ segments });
    const result = await wheel.spinWith(provider.provide, { campaignId: 'summer' });
    expect(result.segmentId).toBe('segment-2');
    expect(provider.requests).toEqual([{ campaignId: 'summer' }]);
  });
  // #endregion provider
});
