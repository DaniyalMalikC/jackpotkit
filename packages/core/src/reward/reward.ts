export interface Reward<TValue = unknown> {
  readonly id: string;
  readonly label?: string;
  readonly value?: TValue;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
