import { resolveResult } from '@jackpotkit/core';
import { describe, expect, it } from 'vitest';

import { MockResultProvider } from './mock-result-provider.js';

describe('MockResultProvider', () => {
  it('returns a fixed result and records immutable request snapshots', async () => {
    const provider = new MockResultProvider<{ playId: string }, { winnerId: string }>({
      result: { winnerId: 'reward-1' },
    });

    await expect(resolveResult(provider.provide, { playId: 'play-1' })).resolves.toEqual({
      winnerId: 'reward-1',
    });

    expect(provider.calls).toBe(1);
    expect(provider.requests).toEqual([{ playId: 'play-1' }]);
    expect(Object.isFrozen(provider.requests)).toBe(true);
  });

  it('supports request-aware asynchronous resolvers and zero-based call indices', async () => {
    const provider = new MockResultProvider<string, string>({
      resolver: async (request, callIndex) => Promise.resolve(`${request}-${callIndex}`),
    });

    await expect(provider.provide('server')).resolves.toBe('server-0');
    await expect(provider.provide('server')).resolves.toBe('server-1');
  });

  it('resets request history without changing configured behavior', () => {
    const provider = new MockResultProvider<void, string>({ result: 'winner' });
    provider.provide(undefined);
    provider.reset();

    expect(provider.calls).toBe(0);
    expect(provider.provide(undefined)).toBe('winner');
  });
});
