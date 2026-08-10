import { JackpotKitError, type JackpotKitErrorOptions } from './jackpot-kit-error.js';

export class InvalidResultError extends JackpotKitError {
  static readonly code = 'INVALID_RESULT';

  constructor(message: string, options: JackpotKitErrorOptions = {}) {
    super(InvalidResultError.code, message, options);
    this.name = 'InvalidResultError';
  }
}
