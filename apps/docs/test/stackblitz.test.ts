import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  createStackBlitzProject,
  sandboxVersions,
  stackBlitzFormFields,
} from '@/lib/playground/stackblitz';

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as Record<
    string,
    unknown
  >;
}

describe('StackBlitz handoff', () => {
  it('installs the versions this workspace publishes', () => {
    for (const name of ['core', 'react', 'theme'] as const) {
      const manifest = readJson(`../../../packages/${name}/package.json`);
      expect(sandboxVersions[`@jackpotkit/${name}`], name).toBe(manifest.version);
    }
    const workspace = readFileSync(
      new URL('../../../pnpm-workspace.yaml', import.meta.url),
      'utf8',
    );
    for (const name of ['react', 'react-dom', '@types/react', '@types/react-dom'] as const) {
      const quoted = name.startsWith('@') ? `'${name}'` : name;
      expect(workspace, name).toContain(`${quoted}: ${sandboxVersions[name]}`);
    }
  });

  it('posts a runnable Vite project with the generated app', () => {
    const project = createStackBlitzProject('Spin Wheel', 'export default function App() {}\n');
    const fields = new Map(stackBlitzFormFields(project));
    expect(fields.get('project[template]')).toBe('node');
    expect(fields.get('project[files][src/App.tsx]')).toBe('export default function App() {}\n');
    for (const file of [
      'index.html',
      'package.json',
      'src/main.tsx',
      'vite.config.ts',
      'tsconfig.json',
    ])
      expect(fields.has(`project[files][${file}]`), file).toBe(true);
    const manifest = JSON.parse(fields.get('project[files][package.json]') ?? '{}') as {
      dependencies: Record<string, string>;
    };
    expect(manifest.dependencies['@jackpotkit/react']).toBe(
      `^${sandboxVersions['@jackpotkit/react']}`,
    );
  });
});
