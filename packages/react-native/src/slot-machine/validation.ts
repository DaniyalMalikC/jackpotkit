import { InvalidConfigurationError } from '@jackpotkit/core';
import type { JackpotTheme } from '@jackpotkit/theme';

import type { SlotMachineProps } from './types';

export function assertSlotMachineComponentConfiguration<TValue, TEvaluation, TRequest>(
  props: SlotMachineProps<TValue, TEvaluation, TRequest>,
  theme: JackpotTheme,
): void {
  const values = [
    ['duration', props.duration ?? theme.animation.slotDuration],
    ['reelDelay', props.reelDelay ?? theme.animation.slotReelDelay],
  ] as const;

  for (const [name, value] of values) {
    if (!Number.isFinite(value) || value < 0) {
      throw new InvalidConfigurationError(`${name} must be a non-negative finite number.`);
    }
  }
  if (
    props.symbolHeight !== undefined &&
    (!Number.isFinite(props.symbolHeight) || props.symbolHeight <= 0)
  ) {
    throw new InvalidConfigurationError('symbolHeight must be a positive finite number.');
  }
  if (props.width !== undefined && (!Number.isFinite(props.width) || props.width <= 0)) {
    throw new InvalidConfigurationError('width must be a positive finite number.');
  }
}
