import type { GameId } from '@/lib/games';

/**
 * Typed control schemas for the documentation playground.
 *
 * Every control names a real prop of the game's `@jackpotkit/react` component, and the allowed
 * control kind follows from that prop's type. A schema is written as `defineGameSchema<Props>()`
 * where `Props` is `ComponentProps<typeof Component>`, so renaming, removing, or retyping a prop
 * in the library breaks the docs typecheck instead of silently drifting.
 */

/** Callback props (`onComplete`, `onError`, ...) of a component. */
export type CallbackKey<P> = Extract<keyof P, `on${string}`>;

/**
 * Props the playground manages itself (result modes, theme, render props, layout escape hatches)
 * instead of exposing them as plain controls.
 */
type ManagedKey =
  | 'board'
  | 'children'
  | 'className'
  | 'evaluate'
  | 'now'
  | 'randomSource'
  | 'ref'
  | 'result'
  | 'resultProvider'
  | 'resultRequest'
  | 'style'
  | 'theme'
  | `render${string}`;

/** Props that may be bound to a control. */
export type ConfigKey<P> = Exclude<keyof P, CallbackKey<P> | ManagedKey> & string;

/** Control state: a value per configurable prop. `undefined` means "use the library default". */
export type ConfigValues<P> = { -readonly [K in ConfigKey<P>]?: P[K] };

/** Configurable props the component requires. */
export type RequiredConfigKey<P> = {
  [K in ConfigKey<P>]-?: object extends Pick<P, K> ? never : K;
}[ConfigKey<P>];

type KeysOfType<P, V> = {
  [K in ConfigKey<P>]-?: [NonNullable<P[K]>] extends [V] ? K : never;
}[ConfigKey<P>];

type ElementOf<T> = T extends readonly (infer I)[] ? I : never;

/** The value type of a component's `result` prop, i.e. its controlled-result selection. */
export type SelectionOf<P> = 'result' extends keyof P ? NonNullable<P['result' & keyof P]> : never;

export type ControlSection = 'props' | 'animation';

interface ControlBase<K extends string> {
  readonly prop: K;
  readonly label: string;
  readonly description?: string;
  /** Defaults to `props`. */
  readonly section?: ControlSection;
}

export interface NumberControl<K extends string = string> extends ControlBase<K> {
  readonly kind: 'number';
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit?: string;
  /**
   * The prop is optional and falls back to a theme or library value. The control shows a "custom"
   * switch; while it is off the prop is omitted.
   */
  readonly optional?: { readonly fallback: number; readonly fallbackLabel: string };
}

export interface SelectOption<V> {
  readonly label: string;
  readonly value: V;
}

export interface SelectControl<K extends string = string, V = unknown> extends ControlBase<K> {
  readonly kind: 'select';
  readonly options: readonly SelectOption<V>[];
}

export interface ToggleControl<K extends string = string> extends ControlBase<K> {
  readonly kind: 'toggle';
}

/** An optional boolean with three states: unset (library behaviour), `true`, `false`. */
export interface TristateControl<K extends string = string> extends ControlBase<K> {
  readonly kind: 'tristate';
  readonly unsetLabel: string;
  readonly trueLabel: string;
  readonly falseLabel: string;
}

export interface TextControl<K extends string = string> extends ControlBase<K> {
  readonly kind: 'text';
}

export interface MultiControl<K extends string = string, V = unknown> extends ControlBase<K> {
  readonly kind: 'multi';
  readonly options: readonly SelectOption<V>[];
}

interface FieldBase<F extends string> {
  readonly key: F;
  readonly label: string;
}
export interface TextField<F extends string = string> extends FieldBase<F> {
  readonly kind: 'text' | 'color';
  /** Text fields only: an empty value removes the key instead of storing `''`. */
  readonly optional?: boolean;
}
export interface NumberField<F extends string = string> extends FieldBase<F> {
  readonly kind: 'number';
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly optional?: boolean;
}
export interface ToggleField<F extends string = string> extends FieldBase<F> {
  readonly kind: 'toggle';
}

type FieldFor<F extends string, V> = [V] extends [string]
  ? TextField<F>
  : [V] extends [number]
    ? NumberField<F>
    : [V] extends [boolean]
      ? ToggleField<F>
      : never;

/** An editable field of a list item, typed by the item property it edits. */
export type ListField<I> = {
  [F in keyof I & string]-?: FieldFor<F, NonNullable<I[F]>>;
}[keyof I & string];

export interface ListControl<
  K extends string = string,
  I = Record<string, unknown>,
> extends ControlBase<K> {
  readonly kind: 'list';
  readonly itemLabel: string;
  readonly minItems: number;
  readonly maxItems: number;
  readonly fields: readonly ListField<I>[];
  readonly createItem: (index: number, items: readonly I[]) => I;
}

/** Every control kind allowed for the props of `P`. */
export type Control<P> =
  | { [K in KeysOfType<P, number>]: NumberControl<K> }[KeysOfType<P, number>]
  | { [K in ConfigKey<P>]: SelectControl<K, NonNullable<P[K]>> }[ConfigKey<P>]
  | { [K in KeysOfType<P, boolean>]: ToggleControl<K> | TristateControl<K> }[KeysOfType<P, boolean>]
  | { [K in KeysOfType<P, string>]: TextControl<K> }[KeysOfType<P, string>]
  | {
      [K in KeysOfType<P, readonly unknown[]>]:
        | MultiControl<K, ElementOf<NonNullable<P[K]>>>
        | ListControl<K, ElementOf<NonNullable<P[K]>>>;
    }[KeysOfType<P, readonly unknown[]>];

/** How the outcome for controlled results and the simulated server is picked. */
export type OutcomeEditor<P, S = SelectionOf<P>> =
  | {
      /** Pick one id, for example a segment, face, or box. */
      readonly kind: 'choice';
      readonly label: string;
      readonly options: (values: ConfigValues<P>) => readonly SelectOption<string>[];
      readonly toSelection: (id: string) => S;
    }
  | {
      /** One number per die. */
      readonly kind: 'numbers';
      readonly label: string;
      readonly items: (
        values: ConfigValues<P>,
      ) => readonly { readonly label: string; readonly max: number }[];
      readonly toSelection: (numbers: readonly number[]) => S;
    }
  | {
      /** A grid of ids: one column per reel, one row per visible row. */
      readonly kind: 'grid';
      readonly label: string;
      readonly shape: (values: ConfigValues<P>) => {
        readonly columns: number;
        readonly rows: number;
        readonly options: readonly SelectOption<string>[];
      };
      readonly toSelection: (grid: readonly (readonly string[])[]) => S;
    }
  | {
      /** Free text, for example a prize label. */
      readonly kind: 'text';
      readonly label: string;
      readonly initial: string;
      readonly toSelection: (text: string) => S;
    };

export type ResultMode = 'random' | 'controlled' | 'provider';

export interface GameSchema<P> {
  readonly game: GameId;
  /** Exported component name, for generated code. */
  readonly componentName: string;
  /** Selection type name exported by `@jackpotkit/core`, for the generated provider signature. */
  readonly selectionType?: string;
  /** Initial control state. Must include every required prop. */
  readonly defaults: ConfigValues<P> & Pick<P, RequiredConfigKey<P>>;
  /**
   * The values the component itself uses when a prop is omitted, read from the component and
   * engine sources. Generated code omits props equal to these.
   */
  readonly libraryDefaults: ConfigValues<P>;
  readonly controls: readonly Control<P>[];
  /** Every callback prop of the component; `defineGameSchema` rejects a missing one. */
  readonly events: readonly CallbackKey<P>[];
  /** Result modes the component supports, with the editor used to pick a fixed outcome. */
  readonly modes: {
    readonly random: boolean;
    readonly controlled: boolean;
    readonly provider: boolean;
  };
  readonly outcome?: OutcomeEditor<P>;
  /** Shown under the result-mode switch. */
  readonly modeNote?: string;
  /** The component needs children (Scratch Card): the prize content under the cover. */
  readonly prizeChildren?: boolean;
}

type MissingEvents<P, E extends readonly unknown[]> = Exclude<CallbackKey<P>, E[number]>;

/**
 * Declares a schema for the component props `P`. Fails to compile when `events` misses one of the
 * component's callback props, so new callbacks always reach the event log.
 */
export function defineGameSchema<P>() {
  return <const E extends readonly CallbackKey<P>[]>(
    schema: GameSchema<P> & { readonly events: E } & ([MissingEvents<P, E>] extends [never]
        ? unknown
        : { readonly missingEvents: MissingEvents<P, E> }),
  ): GameSchema<P> => schema;
}

/**
 * The schema shape the UI works with once a game is chosen. The game-specific types were checked
 * when the schema was defined; the UI only reads and writes plain values.
 */
export interface ErasedSchema extends Omit<
  GameSchema<Record<string, unknown>>,
  'controls' | 'defaults' | 'events' | 'libraryDefaults' | 'outcome'
> {
  readonly defaults: Readonly<Record<string, unknown>>;
  readonly libraryDefaults: Readonly<Record<string, unknown>>;
  readonly controls: readonly ErasedControl[];
  readonly events: readonly string[];
  readonly outcome?: OutcomeEditor<Record<string, unknown>, unknown>;
}

export type ErasedControl =
  | NumberControl
  | SelectControl
  | ToggleControl
  | TristateControl
  | TextControl
  | MultiControl
  | (Omit<ListControl, 'fields'> & {
      readonly fields: readonly (TextField | NumberField | ToggleField)[];
    });

export function eraseSchema<P>(schema: GameSchema<P>): ErasedSchema {
  return schema as unknown as ErasedSchema;
}
