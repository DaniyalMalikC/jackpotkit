import { JackpotKitError, type JackpotKitErrorOptions } from './jackpot-kit-error.js';

export class InvalidSegmentError extends JackpotKitError {
  static readonly code = 'INVALID_SEGMENT';

  constructor(message: string, options: JackpotKitErrorOptions = {}) {
    super(InvalidSegmentError.code, message, options);
    this.name = 'InvalidSegmentError';
  }
}
