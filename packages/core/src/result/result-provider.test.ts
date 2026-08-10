import { describe, expect, it } from 'vitest';

import { ResultProviderError } from '../errors/index.js';
import { resolveResult, type ResultProvider } from './result-provider.js';

describe('resolveResult', () => {
  it('supports synchronous providers', async () => {
    const provider: ResultProvider<{ id: string }, { winnerId: string }> = ({ id }) => ({
      winnerId: id,
    });

    await expect(resolveResult(provider, { id: 'reward-1' })).resolves.toEqual({
      winnerId: 'reward-1',
    });
  });

  it('supports asynchronous server-authoritative providers', async () => {
    const provider: ResultProvider<void, string> = async () => Promise.resolve('server-result');

    await expect(resolveResult(provider, undefined)).resolves.toBe('server-result');
  });

  it('normalizes provider failures and preserves the original cause', async () => {
    const cause = new Error('network unavailable');
    const provider: ResultProvider<void, never> = () => {
      throw cause;
    };

    const rejection = resolveResult(provider, undefined);

    await expect(rejection).rejects.toBeInstanceOf(ResultProviderError);
    await expect(rejection).rejects.toMatchObject({ cause, code: 'RESULT_PROVIDER_ERROR' });
  });

  it('does not double-wrap an intentional ResultProviderError', async () => {
    const expected = new ResultProviderError('Provider response was rejected.');
    const provider: ResultProvider<void, never> = () => {
      throw expected;
    };

    await expect(resolveResult(provider, undefined)).rejects.toBe(expected);
  });
});
