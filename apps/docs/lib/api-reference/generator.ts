import { join } from 'node:path';

import {
  createGenerator,
  type DocEntry,
  type GeneratedDoc,
  type Generator,
} from 'fumadocs-typescript';

type GenerateTypeTableOptions = NonNullable<Parameters<Generator['generateTypeTable']>[1]>;

import { defaultsForType } from './defaults';
import { describeMember } from './descriptions';
import { docsAppRoot, platformOf, repoRoot } from './paths';

/** Types shorter than this are shown in full in the table's type column. */
const MAX_INLINE_TYPE_LENGTH = 72;

function isCallback(entry: DocEntry) {
  return /^on[A-Z]/.test(entry.name);
}

/** Required members first, then other members, then `on*` callbacks; alphabetical within each. */
export function compareEntries(a: DocEntry, b: DocEntry) {
  const rank = (entry: DocEntry) => (entry.required ? 0 : isCallback(entry) ? 2 : 1);
  return rank(a) - rank(b) || a.name.localeCompare(b.name);
}

function enrich(doc: GeneratedDoc, path: string): GeneratedDoc {
  const platform = platformOf(path);
  const defaults = defaultsForType(path, doc.name);
  const entries = doc.entries.map((entry) => {
    const description =
      entry.description.trim() === ''
        ? (describeMember(doc.name, entry.name, platform) ?? '')
        : entry.description;
    const hasDefault = entry.tags.some(
      (tag) => tag.name === 'default' || tag.name === 'defaultValue',
    );
    const value = defaults?.get(entry.name);
    const tags =
      hasDefault || value === undefined
        ? entry.tags
        : [...entry.tags, { name: 'default', text: value }];
    return { ...entry, description, tags };
  });
  return { ...doc, entries: entries.sort(compareEntries) };
}

/**
 * The generator behind every `<auto-type-table>` in `docs/`. It reads the exported types of the
 * workspace packages from source with `tsconfig.api.json` (no build or network needed), resolves
 * `path` from the repository root, and adds the descriptions and component defaults kept in this
 * directory.
 */
export function createApiGenerator(): Generator {
  const base = createGenerator({ tsconfigPath: join(docsAppRoot, 'tsconfig.api.json') });
  const options: GenerateTypeTableOptions = {
    basePath: repoRoot,
    typeSimplifier: {
      shouldSimplify: ({ checker, type }) =>
        checker.typeToString(type).length > MAX_INLINE_TYPE_LENGTH,
    },
  };
  return {
    generateDocumentation: (file, name, generateOptions) =>
      base.generateDocumentation(file, name, generateOptions),
    async generateTypeTable(props, generateOptions) {
      if (props.path === undefined || props.name === undefined) {
        throw new Error('<auto-type-table> needs a repository-relative `path` and a type `name`.');
      }
      const docs = await base.generateTypeTable(props, { ...generateOptions, ...options });
      if (docs.length === 0 || docs.every((doc) => doc.entries.length === 0)) {
        throw new Error(`${props.name} in ${props.path} produced an empty API table.`);
      }
      return docs.map((doc) => enrich(doc, props.path ?? ''));
    },
  };
}

let shared: Generator | undefined;

/** One generator (and one TypeScript process) per build worker. */
export function getApiGenerator(): Generator {
  shared ??= createApiGenerator();
  return shared;
}
