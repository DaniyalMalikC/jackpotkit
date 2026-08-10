import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const repositoryRoot = resolve(import.meta.dirname, '..');
const packageDirectories = ['core', 'react-native', 'react', 'theme', 'testing'];
const expectedRuntimeExports = {
  core: [
    'GAME_EVENT_TYPES',
    'GAME_STATUSES',
    'GameStateError',
    'InvalidConfigurationError',
    'InvalidResultError',
    'JackpotKitError',
    'MathRandomSource',
    'ResultProviderError',
    'SeededRandomSource',
    'assertRandomValue',
    'assertValidConfiguration',
    'assertValidResult',
    'createGameEvent',
    'createValidationResult',
    'isGameStatus',
    'isRandomValue',
    'nextRandomValue',
    'resolveResult',
  ],
  'react-native': [],
  react: [],
  theme: [],
  testing: [
    'MockResultProvider',
    'SequenceRandomSource',
    'createGameResult',
    'createReward',
    'createSequenceRandom',
  ],
};

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
    throw new Error(`${packageJson.name} must expose only its root entrypoint.`);
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

  const actualRuntimeExports = Object.keys(importedModule).sort();
  const intentionalRuntimeExports = expectedRuntimeExports[directory].toSorted();

  if (JSON.stringify(actualRuntimeExports) !== JSON.stringify(intentionalRuntimeExports)) {
    throw new Error(
      `${packageJson.name} runtime exports do not match the Phase 1 allowlist.\n` +
        `Expected: ${intentionalRuntimeExports.join(', ')}\n` +
        `Received: ${actualRuntimeExports.join(', ')}`,
    );
  }
}

console.log('All public package export maps and Phase 1 runtime entrypoints are valid.');
