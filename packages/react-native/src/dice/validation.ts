import { InvalidConfigurationError } from '@jackpotkit/core';

import type { DiceProps } from './types';

export function assertDiceComponentConfiguration<TRequest>(props: DiceProps<TRequest>): void {
  if (props.width !== undefined && (!Number.isFinite(props.width) || props.width <= 0)) {
    throw new InvalidConfigurationError('Dice width must be a positive finite number.');
  }
  if (props.duration !== undefined && (!Number.isFinite(props.duration) || props.duration < 0)) {
    throw new InvalidConfigurationError('Dice duration must be a non-negative finite number.');
  }
}
