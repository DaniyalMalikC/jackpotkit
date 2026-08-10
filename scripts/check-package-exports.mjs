import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const repositoryRoot = resolve(import.meta.dirname, '..');
const packageDirectories = ['core', 'react-native', 'react', 'theme', 'testing'];

function collectExportTargets(value) {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(collectExportTargets);
}

for (const directory of packageDirectories) {
  const packageRoot = join(repositoryRoot, 'packages', directory);
  const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const exportKeys = Object.keys(packageJson.exports ?? {});

  if (exportKeys.length !== 1 || exportKeys[0] !== '.') {
    throw new Error(`${packageJson.name} must expose only its root entrypoint in Phase 0.`);
  }

  for (const target of collectExportTargets(packageJson.exports['.'])) {
    if (target.includes('*')) {
      throw new Error(`${packageJson.name} contains a wildcard export target.`);
    }

    if (!existsSync(join(packageRoot, target))) {
      throw new Error(`${packageJson.name} export target does not exist: ${target}`);
    }
  }

  const importTarget = packageJson.exports['.'].import;
  const importedModule = await import(pathToFileURL(join(packageRoot, importTarget)).href);

  if (Object.keys(importedModule).length !== 0) {
    throw new Error(`${packageJson.name} unexpectedly exposes a runtime API in Phase 0.`);
  }
}

console.log('All public package export maps and empty Phase 0 entrypoints are valid.');
