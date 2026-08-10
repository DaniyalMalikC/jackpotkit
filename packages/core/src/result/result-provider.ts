import { ResultProviderError } from '../errors/index.js';

export type ResultProvider<TRequest, TResult> = (request: TRequest) => TResult | Promise<TResult>;

export async function resolveResult<TRequest, TResult>(
  provider: ResultProvider<TRequest, TResult>,
  request: TRequest,
): Promise<TResult> {
  try {
    return await provider(request);
  } catch (cause) {
    if (cause instanceof ResultProviderError) {
      throw cause;
    }

    throw new ResultProviderError('The result provider failed to resolve a result.', { cause });
  }
}
