import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import ts from 'typescript';

import { repoRoot } from './paths';

/**
 * Reads the default values a component assigns while destructuring its props, for example
 * `size = 320` in `const { size = 320 } = props;` inside `SpinWheelInner`. The values come
 * straight from the component source, so the documented defaults cannot drift from the code.
 *
 * Defaults resolved elsewhere (theme tokens such as `animation.spinDuration`, or engine fallbacks
 * such as Dice's six sides) are described in prose instead.
 */
export function readComponentDefaults(componentFile: string, componentName: string) {
  const absolute = join(repoRoot, componentFile);
  const source = ts.createSourceFile(
    absolute,
    readFileSync(absolute, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const inner = source.statements.find(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === `${componentName}Inner`,
  );
  if (inner?.body === undefined) {
    throw new Error(
      `${componentFile} has no ${componentName}Inner function to read defaults from.`,
    );
  }

  const defaults = new Map<string, string>();
  for (const statement of inner.body.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isObjectBindingPattern(declaration.name) ||
        declaration.initializer === undefined ||
        !ts.isIdentifier(declaration.initializer) ||
        declaration.initializer.text !== 'props'
      )
        continue;
      for (const element of declaration.name.elements) {
        if (element.initializer === undefined) continue;
        const key = element.propertyName ?? element.name;
        if (!ts.isIdentifier(key)) continue;
        const value = element.initializer.getText(source).replace(/\s+/g, ' ');
        // An empty object default (`accessibilityLabels = {}`) only means "no overrides".
        if (value === '{}') continue;
        defaults.set(key.text, value);
      }
    }
  }
  return defaults;
}

const cache = new Map<string, ReadonlyMap<string, string>>();

/**
 * Defaults for a `<Component>Props` interface declared in `packages/<pkg>/src/<game>/types.ts`,
 * read from the sibling `<game>.tsx` component. Returns `undefined` for every other type.
 */
export function defaultsForType(typesFile: string, typeName: string) {
  const match = /^([A-Z][A-Za-z]*)Props$/.exec(typeName);
  if (match?.[1] === undefined || basename(typesFile) !== 'types.ts') return undefined;
  const directory = dirname(typesFile);
  const componentFile = join(directory, `${basename(directory)}.tsx`);
  const key = `${componentFile}#${match[1]}`;
  let defaults = cache.get(key);
  if (defaults === undefined) {
    defaults = readComponentDefaults(componentFile, match[1]);
    cache.set(key, defaults);
  }
  return defaults;
}
