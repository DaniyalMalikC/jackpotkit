import type { ErasedSchema } from './schema';
import { quote, toSource } from './serialize';
import { selectionFor, type PlaygroundState } from './state';

export type ResolvedTheme = 'default' | 'neon';

export interface CodeInput {
  readonly schema: ErasedSchema;
  readonly state: PlaygroundState;
  /** The theme actually rendered (`auto` already resolved against the site colour scheme). */
  readonly theme: ResolvedTheme;
}

export function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null)
    return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Object.keys(left).filter(
    (key) => (left as Record<string, unknown>)[key] !== undefined,
  );
  const rightKeys = Object.keys(right).filter(
    (key) => (right as Record<string, unknown>)[key] !== undefined,
  );
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) =>
    deepEqual((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
  );
}

/** The props, in control order, that differ from the component's own defaults. */
export function changedProps(
  schema: ErasedSchema,
  values: PlaygroundState['values'],
): readonly (readonly [string, unknown])[] {
  const seen = new Set<string>();
  const props: (readonly [string, unknown])[] = [];
  for (const control of schema.controls) {
    if (seen.has(control.prop)) continue;
    seen.add(control.prop);
    const value = values[control.prop];
    if (value === undefined) continue;
    if (
      control.prop in schema.libraryDefaults &&
      deepEqual(value, schema.libraryDefaults[control.prop])
    )
      continue;
    props.push([control.prop, value]);
  }
  return props;
}

function jsxAttribute(name: string, value: unknown): string {
  if (value === true) return name;
  if (typeof value === 'string' && /^[^"{}\\\n\r<>&]*$/.test(value)) return `${name}="${value}"`;
  return `${name}={${toSource(value, 2)}}`;
}

function isPrimitive(value: unknown): boolean {
  return value === null || (typeof value !== 'object' && typeof value !== 'function');
}

/**
 * Generates a complete, self-contained React module for the current playground state. The module
 * imports the game from its exact subpath and passes only props that differ from the library
 * defaults, so pasting it reproduces the preview.
 */
export function generateCode({ schema, state, theme }: CodeInput): string {
  const component = schema.componentName;
  const coreImports: string[] = [];
  const hoisted: string[] = [];
  const attributes: string[] = [];

  for (const [name, value] of changedProps(schema, state.values)) {
    if (isPrimitive(value)) {
      attributes.push(jsxAttribute(name, value));
    } else {
      hoisted.push(`const ${name} = ${toSource(value)} as const;`);
      attributes.push(`${name}={${name}}`);
    }
  }

  if (theme === 'neon') attributes.push('theme={neonTheme}');

  const selection = state.mode === 'random' ? undefined : selectionFor(schema, state.outcome);
  if (state.mode === 'random' && schema.modes.random && state.seed !== '') {
    coreImports.push('SeededRandomSource');
    hoisted.push(
      `// A fixed seed makes every replay produce the same sequence of results.\nconst randomSource = new SeededRandomSource(${quote(state.seed)});`,
    );
    attributes.push('randomSource={randomSource}');
  }
  if (state.mode === 'controlled' && schema.modes.controlled) {
    hoisted.push(`const result = ${toSource(selection)} as const;`);
    attributes.push('result={result}');
  }
  if (state.mode === 'provider' && schema.modes.provider) {
    const type = schema.selectionType ?? 'unknown';
    if (schema.selectionType !== undefined) coreImports.push(`type ${schema.selectionType}`);
    const delay = Math.max(0, Math.round(state.delay));
    const body = state.fail
      ? `  return new Promise((_resolve, reject) => {\n    setTimeout(() => reject(new Error('Simulated server failure')), ${delay});\n  });`
      : `  return new Promise((resolve) => {\n    setTimeout(() => resolve(${toSource(selection, 2)}), ${delay});\n  });`;
    hoisted.push(
      `// Simulates a server that decides the outcome. In production, request it from your API.\nfunction resultProvider(): Promise<${type}> {\n${body}\n}`,
    );
    attributes.push('resultProvider={resultProvider}');
    attributes.push("onError={(error) => console.error('onError', error)}");
  }
  attributes.push("onComplete={(result) => console.log('onComplete', result)}");

  const imports: string[] = [];
  if (coreImports.length > 0)
    imports.push(`import { ${coreImports.join(', ')} } from '@jackpotkit/core';`);
  imports.push(`import { ${component} } from '@jackpotkit/react/${schema.game}';`);
  if (theme === 'neon') imports.push(`import { neonTheme } from '@jackpotkit/theme';`);

  const props = attributes.map((attribute) => `      ${attribute}`).join('\n');
  const element = schema.prizeChildren
    ? `    <${component}\n${props}\n    >\n      {(result) => (\n        <strong style={{ fontSize: 24 }}>{result === undefined ? '' : String(result.prize)}</strong>\n      )}\n    </${component}>`
    : `    <${component}\n${props}\n    />`;

  return [
    imports.join('\n'),
    ...hoisted,
    `export default function App() {\n  return (\n${element}\n  );\n}`,
  ]
    .join('\n\n')
    .concat('\n');
}
