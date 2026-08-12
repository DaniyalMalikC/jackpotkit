import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repositoryRoot = resolve(import.meta.dirname, '..');
const packages = ['core', 'react-native', 'react', 'theme', 'testing'];

for (const directory of packages) {
  const result = spawnSync(
    'pnpm',
    ['exec', 'attw', '--pack', `packages/${directory}`, '--profile', 'esm-only'],
    { cwd: repositoryRoot, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(
      `Package type compatibility failed for packages/${directory}.\n${result.stdout}\n${result.stderr}`,
    );
  }
}

console.log('All packed public packages pass ESM package and TypeScript declaration analysis.');
