import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { afterAll, describe, expect, it } from 'vitest';

import { gameIds, type GameId } from '@/lib/games';
import { changedProps, generateCode, type ResolvedTheme } from '@/lib/playground/codegen';
import { playgroundSchemas } from '@/lib/playground/games';
import type { ErasedSchema } from '@/lib/playground/schema';
import { initialState, normalizeOutcome, type PlaygroundState } from '@/lib/playground/state';

const docsRoot = fileURLToPath(new URL('..', import.meta.url));

interface Variant {
  readonly label: string;
  readonly state: PlaygroundState;
  readonly theme: ResolvedTheme;
}

function withValues(schema: ErasedSchema, state: PlaygroundState, patch: Record<string, unknown>) {
  const values = { ...state.values, ...patch };
  return { ...state, outcome: normalizeOutcome(schema, values, state.outcome), values };
}

/** A modified value for the first control, exercising lists, selects, numbers, and toggles. */
function modifiedFirstControl(
  schema: ErasedSchema,
  state: PlaygroundState,
): Record<string, unknown> {
  const control = schema.controls[0];
  if (control === undefined) return {};
  const current = state.values[control.prop] ?? schema.libraryDefaults[control.prop];
  switch (control.kind) {
    case 'list': {
      const items = (current as readonly Record<string, unknown>[] | undefined) ?? [];
      const next =
        items.length < control.maxItems
          ? [...items, control.createItem(items.length, items)]
          : items.map((item, index) => (index === 0 ? { ...item, label: 'Edited "label"' } : item));
      return { [control.prop]: next };
    }
    case 'number':
      return { [control.prop]: control.max };
    case 'select':
      return { [control.prop]: control.options.at(-1)?.value };
    case 'toggle':
      return { [control.prop]: current !== true };
    case 'tristate':
      return { [control.prop]: true };
    case 'multi':
      return { [control.prop]: control.options.slice(0, 1).map((option) => option.value) };
    case 'text':
      return { [control.prop]: "It's {tricky}" };
  }
}

function variants(game: GameId): readonly Variant[] {
  const schema = playgroundSchemas[game];
  const base = initialState(schema);
  const all: Variant[] = [{ label: 'default', state: base, theme: 'default' }];
  const animated: Record<string, unknown> = {};
  for (const control of schema.controls) {
    if (control.kind === 'number' && control.optional !== undefined)
      animated[control.prop] = control.optional.fallback + control.step;
    if (control.kind === 'tristate') animated[control.prop] = false;
    if (control.kind === 'toggle' && control.prop === 'disabled') animated[control.prop] = true;
  }
  all.push({
    label: 'modified props, seeded, neon',
    state: {
      ...withValues(schema, base, { ...modifiedFirstControl(schema, base), ...animated }),
      seed: 'docs-seed',
    },
    theme: 'neon',
  });
  if (schema.modes.controlled)
    all.push({ label: 'controlled', state: { ...base, mode: 'controlled' }, theme: 'default' });
  if (schema.modes.provider) {
    all.push({
      label: 'provider',
      state: { ...base, delay: 250, mode: 'provider' },
      theme: 'default',
    });
    all.push({
      label: 'failing provider',
      state: { ...base, fail: true, mode: 'provider' },
      theme: 'neon',
    });
  }
  return all;
}

const compilerOptions: ts.CompilerOptions = {
  exactOptionalPropertyTypes: true,
  isolatedModules: true,
  jsx: ts.JsxEmit.ReactJSX,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  noEmit: true,
  noImplicitReturns: true,
  noUncheckedIndexedAccess: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  skipLibCheck: true,
  strict: true,
  target: ts.ScriptTarget.ES2022,
  types: [],
  verbatimModuleSyntax: true,
};

const workDir = mkdtempSync(join(docsRoot, '.codegen-check-'));
afterAll(() => rmSync(workDir, { force: true, recursive: true }));

describe('generated code', () => {
  const files = new Map<
    string,
    { readonly game: GameId; readonly label: string; readonly code: string }
  >();
  for (const game of gameIds) {
    variants(game).forEach((variant, index) => {
      const code = generateCode({
        schema: playgroundSchemas[game],
        state: variant.state,
        theme: variant.theme,
      });
      files.set(join(workDir, `${game}-${index}.tsx`), { code, game, label: variant.label });
    });
  }

  it('covers the default and at least one modified state of every game', () => {
    for (const game of gameIds) {
      const labels = [...files.values()]
        .filter((file) => file.game === game)
        .map((file) => file.label);
      expect(labels).toContain('default');
      expect(labels.length).toBeGreaterThan(1);
    }
  });

  it('type-checks against @jackpotkit/react under the strict repository settings', () => {
    for (const [path, file] of files) writeFileSync(path, file.code);
    const program = ts.createProgram({ options: compilerOptions, rootNames: [...files.keys()] });
    const diagnostics = ts.getPreEmitDiagnostics(program).map((diagnostic) => {
      const file = diagnostic.file === undefined ? undefined : files.get(diagnostic.file.fileName);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      return file === undefined
        ? message
        : `${file.game} (${file.label}): ${message}\n${file.code}`;
    });
    expect(diagnostics).toEqual([]);
  });

  it('imports each game from its exact subpath', () => {
    for (const file of files.values()) {
      const schema = playgroundSchemas[file.game];
      expect(file.code).toContain(
        `import { ${schema.componentName} } from '@jackpotkit/react/${file.game}';`,
      );
      expect(file.code).not.toMatch(/from '@jackpotkit\/react'/);
    }
  });

  it('omits props that equal the component defaults', () => {
    const schema = playgroundSchemas['coin-flip'];
    const state = withValues(schema, initialState(schema), { faceStyle: 'flat', size: 160 });
    expect(changedProps(schema, state.values)).toEqual([]);
    const code = generateCode({ schema, state, theme: 'default' });
    expect(code).not.toContain('faceStyle');
    expect(code).not.toContain('size=');
  });

  it('reflects control changes, result modes, and the theme', () => {
    const schema = playgroundSchemas['spin-wheel'];
    const base = initialState(schema);
    expect(generateCode({ schema, state: base, theme: 'default' })).toContain('size={260}');
    const controlled = generateCode({
      schema,
      state: { ...withValues(schema, base, { size: 300 }), mode: 'controlled', outcome: 'bonus' },
      theme: 'neon',
    });
    expect(controlled).toContain('size={300}');
    expect(controlled).toContain("const result = { segmentId: 'bonus' } as const;");
    expect(controlled).toContain('theme={neonTheme}');
    const failing = generateCode({
      schema,
      state: { ...base, fail: true, mode: 'provider' },
      theme: 'default',
    });
    expect(failing).toContain("reject(new Error('Simulated server failure'))");
    expect(failing).toContain('onError=');
    const seeded = generateCode({ schema, state: { ...base, seed: "o'brien" }, theme: 'default' });
    expect(seeded).toContain("new SeededRandomSource('o\\'brien')");
  });
});
