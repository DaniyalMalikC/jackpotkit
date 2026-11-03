import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { docsAppRoot, repoRoot } from '@/lib/api-reference/paths';

/**
 * Type-checks every docs code sample in `examples/` (embedded in `docs/` with `<include>`) under
 * the repository's strict compiler settings. Workspace packages resolve to their sources, so the
 * samples are checked against the current exported types without a build.
 */
const examplesRoot = join(docsAppRoot, 'examples');
const packages = (path: string) => join(repoRoot, 'packages', path);
const nativeModules = (name: string) => join(packages('react-native'), 'node_modules', name);

function listSources(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return listSources(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

function readPreset(name: string): ts.CompilerOptions {
  const file = join(packages('shared-config'), 'tsconfig', name);
  const { config, error } = ts.readConfigFile(file, ts.sys.readFile);
  if (error !== undefined)
    throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  return ts.parseJsonConfigFileContent(config, ts.sys, join(packages('shared-config'), 'tsconfig'))
    .options;
}

const workspacePaths = {
  '@jackpotkit/core': [packages('core/src/index.ts')],
  '@jackpotkit/core/*': [packages('core/src/*/index.ts')],
  '@jackpotkit/react': [packages('react/src/index.ts')],
  '@jackpotkit/react/*': [packages('react/src/*/index.ts')],
  '@jackpotkit/testing': [packages('testing/src/index.ts')],
  '@jackpotkit/theme': [packages('theme/src/index.ts')],
};

const groups = {
  native: {
    files: listSources(join(examplesRoot, 'native')),
    options: {
      ...readPreset('react-native.json'),
      paths: {
        ...workspacePaths,
        '@jackpotkit/react-native': [packages('react-native/src/index.ts')],
        '@jackpotkit/react-native/*': [packages('react-native/src/*/index.ts')],
        'expo-router': [join(repoRoot, 'apps/expo-example/node_modules/expo-router')],
        'react-native': [nativeModules('react-native')],
        'react-native-gesture-handler': [nativeModules('react-native-gesture-handler')],
      },
      types: [],
    },
  },
  web: {
    files: [
      ...listSources(join(examplesRoot, 'web')),
      ...listSources(join(examplesRoot, 'server')),
      ...listSources(join(examplesRoot, 'testing')),
    ],
    options: {
      ...readPreset('react.json'),
      jsx: ts.JsxEmit.ReactJSX,
      paths: workspacePaths,
      types: [],
    },
  },
} satisfies Record<string, { files: string[]; options: ts.CompilerOptions }>;

describe('docs code samples', () => {
  it.each(Object.entries(groups))('%s samples type-check', (_name, group) => {
    expect(group.files.length).toBeGreaterThan(0);
    const program = ts.createProgram(group.files, { ...group.options, noEmit: true });
    const samples = new Set(group.files);
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      // Package sources are checked by their own typecheck with their own settings.
      .filter(
        (diagnostic) => diagnostic.file === undefined || samples.has(diagnostic.file.fileName),
      )
      .map((diagnostic) => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        if (diagnostic.file === undefined || diagnostic.start === undefined) return message;
        const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        return `${relative(repoRoot, diagnostic.file.fileName)}:${line + 1} ${message}`;
      });
    expect(diagnostics).toEqual([]);
  });
});
