export interface JackpotKitErrorOptions {
  readonly cause?: unknown;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export class JackpotKitError extends Error {
  readonly code: string;
  readonly metadata?: Readonly<Record<string, unknown>>;

  constructor(code: string, message: string, options: JackpotKitErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });

    this.name = 'JackpotKitError';
    this.code = code;

    if (options.metadata !== undefined) {
      this.metadata = Object.freeze({ ...options.metadata });
    }
  }
}
