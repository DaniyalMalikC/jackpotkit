import type { ScratchCardSelection } from '@jackpotkit/core';

export interface CreateScratchCardSelectionOptions {
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function createScratchCardSelection<TPrize = unknown>(
  prize?: TPrize,
  options: CreateScratchCardSelectionOptions = {},
): ScratchCardSelection<TPrize> {
  return Object.freeze({
    ...(prize === undefined ? {} : { prize }),
    ...(options.metadata === undefined ? {} : { metadata: Object.freeze({ ...options.metadata }) }),
  });
}
