'use client';

import { SeededRandomSource } from '@jackpotkit/core';
import { neonTheme } from '@jackpotkit/theme';
import { useTheme } from 'next-themes';
import { useCallback, useMemo, useRef, useState } from 'react';

import { games, type GameId } from '@/lib/games';
import { generateCode, type ResolvedTheme } from '@/lib/playground/codegen';
import { playgroundSchemas } from '@/lib/playground/games';
import type { ErasedSchema, ResultMode } from '@/lib/playground/schema';
import { toLoggable } from '@/lib/playground/serialize';
import {
  configProps,
  initialState,
  normalizeOutcome,
  previewWidths,
  selectionFor,
  supportedModes,
  type OutcomeValue,
  type PlaygroundState,
  type PreviewWidth,
  type ThemeChoice,
} from '@/lib/playground/state';

import { CodePanel } from './code-panel';
import { ControlInput } from './controls';
import { errorMessage, PreviewErrorBoundary } from './error-boundary';
import { EventLog, type LogEntry } from './event-log';
import { GamePreview, type ResettableGame } from './game-preview';
import { Button, Checkbox, Field, Panel, Segmented, Select, TextInput } from './ui';

const MAX_LOG_ENTRIES = 300;

const modeLabels: Readonly<Record<ResultMode, string>> = {
  controlled: 'Controlled',
  provider: 'Server provider',
  random: 'Random',
};

const widthOptions: readonly { readonly label: string; readonly value: PreviewWidth }[] = [
  { label: 'Mobile 360', value: 'mobile' },
  { label: 'Tablet 768', value: 'tablet' },
  { label: 'Full', value: 'full' },
];

const themeBackgrounds: Readonly<Record<ResolvedTheme, string>> = {
  default: '#F7F6FB',
  neon: neonTheme.colors.background,
};

function timestamp(): string {
  const now = new Date();
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
}

function OutcomeInput({
  onChange,
  schema,
  state,
}: {
  readonly onChange: (outcome: OutcomeValue) => void;
  readonly schema: ErasedSchema;
  readonly state: PlaygroundState;
}) {
  const editor = schema.outcome;
  if (editor === undefined) return null;
  const effective = { ...schema.libraryDefaults, ...state.values };
  const outcome = state.outcome;
  switch (editor.kind) {
    case 'choice': {
      const options = editor.options(effective);
      return (
        <Field label={editor.label}>
          {({ id }) => (
            <Select
              disabled={options.length === 0}
              id={id}
              onChange={(event) => onChange(event.currentTarget.value)}
              value={typeof outcome === 'string' ? outcome : ''}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      );
    }
    case 'text':
      return (
        <Field label={editor.label}>
          {({ id }) => (
            <TextInput
              id={id}
              onChange={(event) => onChange(event.currentTarget.value)}
              value={typeof outcome === 'string' ? outcome : ''}
            />
          )}
        </Field>
      );
    case 'numbers': {
      const values = Array.isArray(outcome) ? (outcome as readonly number[]) : [];
      return (
        <fieldset className="flex min-w-0 flex-col gap-1 sm:col-span-2">
          <legend className="mb-1 text-xs font-medium">{editor.label}</legend>
          <div className="flex flex-wrap gap-2">
            {editor.items(effective).map((item, index) => (
              <label className="flex flex-col gap-1 text-xs" key={index}>
                {item.label}
                <TextInput
                  className="!w-20"
                  max={item.max}
                  min={1}
                  onChange={(event) => {
                    const parsed = Math.round(Number(event.currentTarget.value));
                    if (!Number.isFinite(parsed)) return;
                    const next = [...values];
                    next[index] = Math.min(Math.max(parsed, 1), item.max);
                    onChange(next);
                  }}
                  type="number"
                  value={values[index] ?? 1}
                />
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    case 'grid': {
      const shape = editor.shape(effective);
      const grid = Array.isArray(outcome) ? (outcome as readonly (readonly string[])[]) : [];
      return (
        <fieldset className="flex min-w-0 flex-col gap-1 sm:col-span-2">
          <legend className="mb-1 text-xs font-medium">{editor.label}</legend>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${shape.columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: shape.rows }, (_, row) =>
              Array.from({ length: shape.columns }, (_, column) => (
                <Select
                  aria-label={`Reel ${column + 1}, row ${row + 1}`}
                  key={`${row}:${column}`}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    onChange(
                      grid.map((reel, reelIndex) =>
                        reelIndex === column
                          ? reel.map((symbol, rowIndex) => (rowIndex === row ? value : symbol))
                          : reel,
                      ),
                    );
                  }}
                  value={grid[column]?.[row] ?? ''}
                >
                  {shape.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )),
            )}
          </div>
        </fieldset>
      );
    }
  }
}

/**
 * The interactive playground for one game: the real `@jackpotkit/react` component with typed prop
 * controls, result modes, an event log, and generated code. Loaded on game pages only, client-side.
 */
export function Playground({ game }: { readonly game: GameId }) {
  const schema = playgroundSchemas[game];
  const name = games.find((candidate) => candidate.id === game)?.name ?? game;
  const [state, setState] = useState(() => initialState(schema));
  const [entries, setEntries] = useState<readonly LogEntry[]>([]);
  const [mountKey, setMountKey] = useState(0);
  const nextEntryId = useRef(0);
  const gameRef = useRef<ResettableGame | null>(null);
  const { resolvedTheme: siteTheme } = useTheme();
  const theme: ResolvedTheme =
    state.theme === 'auto' ? (siteTheme === 'dark' ? 'neon' : 'default') : state.theme;
  const modes = supportedModes(schema);

  const log = useCallback((eventName: string, args: readonly unknown[]) => {
    const payload =
      args.length === 0
        ? undefined
        : JSON.stringify(toLoggable(args.length === 1 ? args[0] : args), null, 2);
    const entry: LogEntry = {
      id: nextEntryId.current++,
      name: eventName,
      payload,
      time: timestamp(),
    };
    setEntries((current) => [...current.slice(-(MAX_LOG_ENTRIES - 1)), entry]);
  }, []);

  const callbacks = useMemo(
    () =>
      Object.fromEntries(
        schema.events.map((eventName) => [eventName, (...args: unknown[]) => log(eventName, args)]),
      ),
    [log, schema],
  );

  // Rewound on reset and remount, so a seeded replay repeats the same sequence.
  const randomSource = useMemo(
    () =>
      state.mode === 'random' && state.seed !== '' ? new SeededRandomSource(state.seed) : undefined,
    [state.mode, state.seed],
  );
  const selection = useMemo(() => selectionFor(schema, state.outcome), [schema, state.outcome]);
  const { delay, fail, mode } = state;
  const resultProvider = useMemo(() => {
    if (mode !== 'provider') return undefined;
    return () =>
      new Promise<unknown>((resolve, reject) => {
        window.setTimeout(() => {
          if (fail) reject(new Error('Simulated server failure'));
          else resolve(selection);
        }, delay);
      });
  }, [delay, fail, mode, selection]);

  const props = useMemo(
    () => ({
      ...configProps(state.values),
      ...(theme === 'neon' ? { theme: neonTheme } : {}),
      ...(randomSource === undefined ? {} : { randomSource }),
      ...(state.mode === 'controlled' && schema.modes.controlled ? { result: selection } : {}),
      ...(resultProvider === undefined ? {} : { resultProvider }),
      ...callbacks,
    }),
    [callbacks, randomSource, resultProvider, schema, selection, state.mode, state.values, theme],
  );

  const code = useMemo(() => generateCode({ schema, state, theme }), [schema, state, theme]);

  const update = (patch: Partial<PlaygroundState>) =>
    setState((current) => ({ ...current, ...patch }));
  const setValue = (prop: string, value: unknown) =>
    setState((current) => {
      const rest = Object.fromEntries(
        Object.entries(current.values).filter(([entry]) => entry !== prop),
      );
      const values = value === undefined ? rest : { ...rest, [prop]: value };
      return { ...current, outcome: normalizeOutcome(schema, values, current.outcome), values };
    });
  const setGameRef = useCallback((instance: ResettableGame | null) => {
    gameRef.current = instance;
  }, []);

  const resetKey = JSON.stringify([state.values, state.mode, state.seed, state.outcome, mountKey]);
  const maxWidth = previewWidths[state.width];

  const controlsBySection = (section: 'props' | 'animation') =>
    schema.controls
      .filter((control) => (control.section ?? 'props') === section)
      .map((control) => (
        <ControlInput
          control={control}
          fallback={schema.libraryDefaults[control.prop]}
          key={control.prop}
          onChange={(value) => setValue(control.prop, value)}
          value={state.values[control.prop]}
        />
      ));
  const animationControls = controlsBySection('animation');

  return (
    <figure
      className="not-prose my-6 min-w-0 overflow-hidden rounded-xl border bg-fd-card text-fd-card-foreground"
      data-playground={game}
    >
      <div className="flex flex-wrap items-end gap-3 p-4">
        <Field label="Theme">
          {({ id }) => (
            <Select
              className="w-auto"
              id={id}
              onChange={(event) => update({ theme: event.currentTarget.value as ThemeChoice })}
              value={state.theme}
            >
              <option value="auto">Match site ({theme === 'neon' ? 'neon' : 'default'})</option>
              <option value="default">Default</option>
              <option value="neon">Neon</option>
            </Select>
          )}
        </Field>
        <Segmented
          label="Preview width"
          name={`${game}-width`}
          onChange={(width) => update({ width })}
          options={widthOptions}
          value={state.width}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              gameRef.current?.reset();
              randomSource?.reset();
            }}
          >
            Reset game
          </Button>
          <Button
            onClick={() => {
              randomSource?.reset();
              setMountKey((key) => key + 1);
            }}
          >
            Remount
          </Button>
          <Button
            onClick={() => {
              setState(initialState(schema));
              setMountKey((key) => key + 1);
            }}
            variant="ghost"
          >
            Restore defaults
          </Button>
        </div>
      </div>

      <section
        aria-label={`${name} preview`}
        className="jk-demo-surface flex min-h-[340px] justify-center overflow-x-auto border-y p-4"
        data-testid="playground-preview"
        style={{ backgroundColor: themeBackgrounds[theme] }}
      >
        <div
          className="flex w-full min-w-0 items-center justify-center"
          data-preview-width={state.width}
          style={maxWidth === undefined ? undefined : { maxWidth }}
        >
          <PreviewErrorBoundary
            renderError={(error) => (
              <div
                className="max-w-full rounded-md border border-red-500/60 bg-fd-background p-3 text-sm"
                role="alert"
              >
                <p className="m-0 font-semibold">The component rejected this configuration</p>
                <p
                  className="m-0 mt-1 font-mono text-xs break-words"
                  data-testid="playground-error"
                >
                  {errorMessage(error)}
                </p>
                <p className="m-0 mt-2 text-xs text-fd-muted-foreground">
                  Change a control or choose Restore defaults to try again.
                </p>
              </div>
            )}
            resetKey={resetKey}
          >
            <GamePreview game={game} gameRef={setGameRef} key={mountKey} props={props} />
          </PreviewErrorBoundary>
        </div>
      </section>

      <Panel title="Result mode">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {modes.length > 1 ? (
              <Segmented
                label="Outcome source"
                name={`${game}-mode`}
                onChange={(mode) => update({ mode })}
                options={modes.map((mode) => ({ label: modeLabels[mode], value: mode }))}
                value={state.mode}
              />
            ) : (
              <p className="m-0 text-sm">
                Outcome source: <strong>{modeLabels[state.mode]}</strong>
              </p>
            )}
            {schema.modeNote === undefined ? null : (
              <p className="m-0 mt-2 text-xs text-fd-muted-foreground">{schema.modeNote}</p>
            )}
          </div>
          {state.mode === 'random' ? (
            <Field
              hint="Uses SeededRandomSource from @jackpotkit/core. Leave empty for Math.random."
              label="Seed (optional)"
            >
              {({ hintId, id }) => (
                <TextInput
                  aria-describedby={hintId}
                  id={id}
                  onChange={(event) => update({ seed: event.currentTarget.value })}
                  placeholder="for example demo-1"
                  value={state.seed}
                />
              )}
            </Field>
          ) : (
            <OutcomeInput
              onChange={(outcome) => update({ outcome })}
              schema={schema}
              state={state}
            />
          )}
          {state.mode === 'provider' ? (
            <>
              <Field
                hint="Simulated server latency before resultProvider settles."
                label={`Server delay (${state.delay} ms)`}
              >
                {({ hintId, id }) => (
                  <input
                    aria-describedby={hintId}
                    className="h-9 accent-fd-primary"
                    id={id}
                    max={3000}
                    min={0}
                    onChange={(event) => update({ delay: Number(event.currentTarget.value) })}
                    step={100}
                    type="range"
                    value={state.delay}
                  />
                )}
              </Field>
              <Checkbox
                checked={state.fail}
                label="Fail the request (calls onError)"
                onChange={(fail) => update({ fail })}
              />
            </>
          ) : null}
        </div>
      </Panel>

      <Panel title="Props">
        <div className="grid gap-3 sm:grid-cols-2">{controlsBySection('props')}</div>
      </Panel>

      {animationControls.length === 0 ? null : (
        <Panel title="Animation">
          <div className="grid gap-3 sm:grid-cols-2">{animationControls}</div>
        </Panel>
      )}

      <EventLog entries={entries} onClear={() => setEntries([])} />
      <CodePanel code={code} gameName={name} />

      <figcaption className="border-t px-4 py-3 text-sm text-fd-muted-foreground">
        Live <code>{schema.componentName}</code> from <code>@jackpotkit/react/{game}</code>. The
        React Native component in <code>@jackpotkit/react-native/{game}</code> uses native animation
        libraries that do not run in the browser, so this page previews the web renderer only.
      </figcaption>
    </figure>
  );
}
