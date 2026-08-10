import { JackpotKitError, type JackpotKitErrorOptions } from './jackpot-kit-error.js';

export class ResultProviderError extends JackpotKitError {
  static readonly code = 'RESULT_PROVIDER_ERROR';

  constructor(message: string, options: JackpotKitErrorOptions = {}) {
    super(ResultProviderError.code, message, options);
    this.name = 'ResultProviderError';
  }
}
