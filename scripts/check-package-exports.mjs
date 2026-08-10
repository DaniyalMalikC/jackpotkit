import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const repositoryRoot = resolve(import.meta.dirname, '..');
const packageDirectories = ['core', 'react-native', 'react', 'theme', 'testing'];
const expectedEntrypoints = {
  core: ['.', './spin-wheel'],
  'react-native': ['.', './spin-wheel'],
  react: ['.'],
  theme: ['.'],
  testing: ['.'],
};
const expectedRuntimeExports = {
  core: [
    'AnimationError',
    'GAME_EVENT_TYPES',
    'GAME_STATUSES',
    'GameStateError',
    'InvalidConfigurationError',
    'InvalidResultError',
    'InvalidSegmentError',
    'JackpotKitError',
    'MathRandomSource',
    'ResultProviderError',
    'SeededRandomSource',
    'assertRandomValue',
    'assertValidConfiguration',
    'assertValidResult',
    'assertValidSpinWheelSegments',
    'assertValidSpinWheelSelection',
    'calculateSpinWheelDestination',
    'createGameEvent',
    'createValidationResult',
    'createSpinWheel',
    'isGameStatus',
    'isRandomValue',
    'nextRandomValue',
    'resolveResult',
    'selectSpinWheelSegment',
    'validateSpinWheelSegments',
    'validateSpinWheelSelection',
  ],
  'react-native': ['JackpotKitProvider', 'SpinWheel', 'useJackpotKitTheme', 'useSpinWheel'],
  react: [],
  theme: ['createJackpotTheme', 'defaultTheme', 'neonTheme'],
  testing: [
    'MockResultProvider',
    'SequenceRandomSource',
    'createGameResult',
    'createReward',
    'createSequenceRandom',
    'createWheelSegments',
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

  if (JSON.stringify(exportKeys) !== JSON.stringify(expectedEntrypoints[directory])) {
    throw new Error(
      `${packageJson.name} entrypoints do not match the implemented feature allowlist.`,
    );
  }

  for (const entrypoint of exportKeys) {
    for (const target of collectExportTargets(packageJson.exports[entrypoint])) {
      if (target.includes('*')) {
        throw new Error(`${packageJson.name} contains a wildcard export target.`);
      }

      if (!existsSync(join(packageRoot, target))) {
        throw new Error(`${packageJson.name} export target does not exist: ${target}`);
      }
    }
  }

  if (directory === 'react-native') {
    continue;
  }

  const importTarget = packageJson.exports['.'].import;
  const importedModule = await import(pathToFileURL(join(packageRoot, importTarget)).href);

  const actualRuntimeExports = Object.keys(importedModule).sort();
  const intentionalRuntimeExports = expectedRuntimeExports[directory].toSorted();

  if (JSON.stringify(actualRuntimeExports) !== JSON.stringify(intentionalRuntimeExports)) {
    throw new Error(
      `${packageJson.name} runtime exports do not match the Phase 2 allowlist.\n` +
        `Expected: ${intentionalRuntimeExports.join(', ')}\n` +
        `Received: ${actualRuntimeExports.join(', ')}`,
    );
  }
}

const coreSpinWheel = await import(
  pathToFileURL(join(repositoryRoot, 'packages/core/dist/spin-wheel/index.js')).href
);
const spinWheelRuntimeExports = Object.keys(coreSpinWheel).sort();
const expectedSpinWheelRuntimeExports = [
  'assertValidSpinWheelSegments',
  'assertValidSpinWheelSelection',
  'calculateSpinWheelDestination',
  'createSpinWheel',
  'selectSpinWheelSegment',
  'validateSpinWheelSegments',
  'validateSpinWheelSelection',
].sort();

if (JSON.stringify(spinWheelRuntimeExports) !== JSON.stringify(expectedSpinWheelRuntimeExports)) {
  throw new Error('The core Spin Wheel subpath runtime exports do not match its allowlist.');
}

console.log('All public package export maps and Phase 2 runtime entrypoints are valid.');
