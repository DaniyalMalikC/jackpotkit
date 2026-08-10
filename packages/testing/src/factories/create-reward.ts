import type { Reward } from '@jackpotkit/core';

export interface CreateRewardOptions<TValue = unknown> {
  readonly id?: string;
  readonly label?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly value?: TValue;
}

export function createReward<TValue = unknown>(
  options: CreateRewardOptions<TValue> = {},
): Reward<TValue> {
  return {
    id: options.id ?? 'test-reward',
    ...(options.label === undefined ? {} : { label: options.label }),
    ...(options.value === undefined ? {} : { value: options.value }),
    ...(options.metadata === undefined ? {} : { metadata: { ...options.metadata } }),
  };
}
