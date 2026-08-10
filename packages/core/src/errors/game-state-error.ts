import { JackpotKitError, type JackpotKitErrorOptions } from './jackpot-kit-error.js';

export class GameStateError extends JackpotKitError {
  static readonly code = 'GAME_STATE_ERROR';

  constructor(message: string, options: JackpotKitErrorOptions = {}) {
    super(GameStateError.code, message, options);
    this.name = 'GameStateError';
  }
}
