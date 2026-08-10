export interface GameResult<TData = unknown> {
  readonly id: string;
  readonly game: string;
  readonly data: TData;
  readonly timestamp: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
