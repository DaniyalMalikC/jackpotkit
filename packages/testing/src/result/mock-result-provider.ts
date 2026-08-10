import type { ResultProvider } from '@jackpotkit/core';

export type MockResultResolver<TRequest, TResult> = (
  request: TRequest,
  callIndex: number,
) => TResult | Promise<TResult>;

export type MockResultProviderOptions<TRequest, TResult> =
  { readonly result: TResult } | { readonly resolver: MockResultResolver<TRequest, TResult> };

export class MockResultProvider<TRequest, TResult> {
  readonly #options: MockResultProviderOptions<TRequest, TResult>;
  readonly #requests: TRequest[] = [];

  constructor(options: MockResultProviderOptions<TRequest, TResult>) {
    this.#options = options;
  }

  get calls(): number {
    return this.#requests.length;
  }

  get requests(): readonly TRequest[] {
    return Object.freeze([...this.#requests]);
  }

  readonly provide: ResultProvider<TRequest, TResult> = (request) => {
    const callIndex = this.#requests.length;
    this.#requests.push(request);

    if ('resolver' in this.#options) {
      return this.#options.resolver(request, callIndex);
    }

    return this.#options.result;
  };

  reset(): void {
    this.#requests.length = 0;
  }
}
