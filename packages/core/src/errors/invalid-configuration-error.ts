import { JackpotKitError, type JackpotKitErrorOptions } from './jackpot-kit-error.js';

export class InvalidConfigurationError extends JackpotKitError {
  static readonly code = 'INVALID_CONFIGURATION';

  constructor(message: string, options: JackpotKitErrorOptions = {}) {
    super(InvalidConfigurationError.code, message, options);
    this.name = 'InvalidConfigurationError';
  }
}
