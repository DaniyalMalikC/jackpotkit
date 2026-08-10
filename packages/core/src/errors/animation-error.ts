import { JackpotKitError, type JackpotKitErrorOptions } from './jackpot-kit-error.js';

export class AnimationError extends JackpotKitError {
  static readonly code = 'ANIMATION_ERROR';

  constructor(message: string, options: JackpotKitErrorOptions = {}) {
    super(AnimationError.code, message, options);
    this.name = 'AnimationError';
  }
}
