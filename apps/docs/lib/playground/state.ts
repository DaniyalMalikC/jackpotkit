import type { ErasedSchema, ResultMode } from './schema';

export type OutcomeValue = string | readonly number[] | readonly (readonly string[])[];
export type ThemeChoice = 'auto' | 'default' | 'neon';
export type PreviewWidth = 'mobile' | 'tablet' | 'full';

export const previewWidths: Readonly<Record<PreviewWidth, number | undefined>> = {
  full: undefined,
  mobile: 360,
  tablet: 768,
};

/** Everything the playground controls. Serializable, so it can key remounts and code. */
export interface PlaygroundState {
  readonly values: Readonly<Record<string, unknown>>;
  readonly mode: ResultMode;
  /** Seed for `SeededRandomSource`; empty means the default `Math.random` source. */
  readonly seed: string;
  readonly outcome: OutcomeValue;
  /** Simulated server latency, in milliseconds. */
  readonly delay: number;
  /** The simulated server rejects instead of resolving. */
  readonly fail: boolean;
  readonly theme: ThemeChoice;
  readonly width: PreviewWidth;
}

export function supportedModes(schema: ErasedSchema): readonly ResultMode[] {
  return (['random', 'controlled', 'provider'] as const).filter((mode) => schema.modes[mode]);
}

export function initialState(schema: ErasedSchema): PlaygroundState {
  const values = { ...schema.defaults };
  return {
    delay: 800,
    fail: false,
    mode: supportedModes(schema)[0] ?? 'random',
    outcome: normalizeOutcome(schema, values, undefined),
    seed: '',
    theme: 'auto',
    values,
    width: 'full',
  };
}

/** The value a control shows: the explicit value, else the component's own default. */
export function displayValue(
  schema: ErasedSchema,
  values: PlaygroundState['values'],
  prop: string,
) {
  return values[prop] ?? schema.libraryDefaults[prop];
}

/** Coerces a stored outcome to one that fits the current controls (ids exist, sizes match). */
export function normalizeOutcome(
  schema: ErasedSchema,
  values: PlaygroundState['values'],
  current: OutcomeValue | undefined,
): OutcomeValue {
  const editor = schema.outcome;
  if (editor === undefined) return '';
  const effective = { ...schema.libraryDefaults, ...values };
  switch (editor.kind) {
    case 'choice': {
      const options = editor.options(effective);
      if (typeof current === 'string' && options.some((option) => option.value === current))
        return current;
      return options[0]?.value ?? '';
    }
    case 'text':
      return typeof current === 'string' ? current : editor.initial;
    case 'numbers': {
      const items = editor.items(effective);
      const previous = Array.isArray(current) ? (current as readonly unknown[]) : [];
      return items.map((item, index) => {
        const value = previous[index];
        return typeof value === 'number' && Number.isInteger(value)
          ? Math.min(Math.max(value, 1), item.max)
          : Math.min(index + 3, item.max);
      });
    }
    case 'grid': {
      const shape = editor.shape(effective);
      const ids = shape.options.map((option) => option.value);
      const previous = Array.isArray(current) ? (current as readonly unknown[]) : [];
      return Array.from({ length: Math.max(0, shape.columns) }, (_, column) => {
        const reel = Array.isArray(previous[column])
          ? (previous[column] as readonly unknown[])
          : [];
        return Array.from({ length: Math.max(0, shape.rows) }, (_, row) => {
          const value = reel[row];
          return typeof value === 'string' && ids.includes(value) ? value : (ids[0] ?? '');
        });
      });
    }
  }
}

/** The selection object passed as `result` or returned by the simulated server. */
export function selectionFor(schema: ErasedSchema, outcome: OutcomeValue): unknown {
  const editor = schema.outcome;
  if (editor === undefined) return undefined;
  switch (editor.kind) {
    case 'choice':
    case 'text':
      return editor.toSelection(typeof outcome === 'string' ? outcome : '');
    case 'numbers':
      return editor.toSelection(Array.isArray(outcome) ? (outcome as readonly number[]) : []);
    case 'grid':
      return editor.toSelection(
        Array.isArray(outcome) ? (outcome as readonly (readonly string[])[]) : [],
      );
  }
}

/** Control values as component props: unset values are dropped, not passed as `undefined`. */
export function configProps(values: PlaygroundState['values']): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}
