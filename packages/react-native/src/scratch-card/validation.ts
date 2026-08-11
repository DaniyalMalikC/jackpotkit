import { assertValidScratchCardConfiguration, InvalidConfigurationError } from '@jackpotkit/core';

import type { ScratchCardProps } from './types';

export function assertScratchCardComponentConfiguration<TPrize, TRequest>(
  props: ScratchCardProps<TPrize, TRequest>,
): void {
  assertValidScratchCardConfiguration({
    brushRadius: props.brushRadius ?? 18,
    height: props.height,
    threshold: props.threshold ?? 0.65,
    width: props.width,
  });

  if (
    props.revealDuration !== undefined &&
    (!Number.isFinite(props.revealDuration) || props.revealDuration < 0)
  ) {
    throw new InvalidConfigurationError('revealDuration must be a non-negative finite number.');
  }

  if (
    props.borderRadius !== undefined &&
    (!Number.isFinite(props.borderRadius) || props.borderRadius < 0)
  ) {
    throw new InvalidConfigurationError('borderRadius must be a non-negative finite number.');
  }
}
