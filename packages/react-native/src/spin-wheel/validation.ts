import { InvalidConfigurationError, isGameStatus } from '@jackpotkit/core';
import type { JackpotTheme } from '@jackpotkit/theme';

import type { SpinWheelProps } from './types';

export function assertSpinWheelComponentConfiguration<TValue, TRequest>(
  props: SpinWheelProps<TValue, TRequest>,
  theme: JackpotTheme,
): void {
  if (props.duration !== undefined && (!Number.isFinite(props.duration) || props.duration < 0)) {
    throw new InvalidConfigurationError('SpinWheel duration must be a finite number at least 0.');
  }

  if (
    props.rotations !== undefined &&
    (!Number.isInteger(props.rotations) || props.rotations < 0)
  ) {
    throw new InvalidConfigurationError('SpinWheel rotations must be a non-negative integer.');
  }

  if (props.size !== undefined && (!Number.isFinite(props.size) || props.size <= 0)) {
    throw new InvalidConfigurationError('SpinWheel size must be a finite number greater than 0.');
  }

  if (props.status !== undefined && !isGameStatus(props.status)) {
    throw new InvalidConfigurationError('SpinWheel status is not a supported GameStatus.');
  }

  if (props.result !== undefined && props.resultProvider !== undefined) {
    throw new InvalidConfigurationError(
      'SpinWheel accepts either result or resultProvider for a play, not both.',
    );
  }

  if (theme.colors.wheelPalette.length === 0) {
    throw new InvalidConfigurationError('SpinWheel theme wheelPalette must not be empty.');
  }
}
