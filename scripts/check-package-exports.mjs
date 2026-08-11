import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const repositoryRoot = resolve(import.meta.dirname, '..');
const packageDirectories = ['core', 'react-native', 'react', 'theme', 'testing'];
const expectedEntrypoints = {
  core: ['.', './spin-wheel', './scratch-card', './slot-machine'],
  'react-native': ['.', './spin-wheel', './scratch-card', './slot-machine'],
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
    'assertValidScratchCardConfiguration',
    'assertValidScratchCardSelection',
    'assertValidScratchPoint',
    'assertValidScratchProgress',
    'assertValidSlotMachineConfiguration',
    'assertValidSlotMachineSelection',
    'assertValidSlotSymbols',
    'assertValidSpinWheelSegments',
    'assertValidSpinWheelSelection',
    'calculateSpinWheelDestination',
    'createDefaultSlotPaylines',
    'createGameEvent',
    'createRandomSlotSelection',
    'createScratchCard',
    'createScratchProgressTracker',
    'createSlotMachine',
    'createValidationResult',
    'createSpinWheel',
    'evaluateSlotPaylines',
    'isGameStatus',
    'isRandomValue',
    'nextRandomValue',
    'resolveResult',
    'selectSlotSymbol',
    'selectSpinWheelSegment',
    'validateScratchCardConfiguration',
    'validateSlotMachineConfiguration',
    'validateSlotSymbols',
    'validateSpinWheelSegments',
    'validateSpinWheelSelection',
  ],
  'react-native': [
    'JackpotKitProvider',
    'SlotMachine',
    'SpinWheel',
    'useJackpotKitTheme',
    'useSlotMachine',
    'useSpinWheel',
  ],
  react: [],
  theme: ['createJackpotTheme', 'defaultTheme', 'neonTheme'],
  testing: [
    'MockResultProvider',
    'SequenceRandomSource',
    'createGameResult',
    'createReward',
    'createScratchCardSelection',
    'createSlotSymbols',
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
      `${packageJson.name} runtime exports do not match the Phase 4 allowlist.\n` +
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

const coreScratchCard = await import(
  pathToFileURL(join(repositoryRoot, 'packages/core/dist/scratch-card/index.js')).href
);
const scratchCardRuntimeExports = Object.keys(coreScratchCard).sort();
const expectedScratchCardRuntimeExports = [
  'assertValidScratchCardConfiguration',
  'assertValidScratchCardSelection',
  'assertValidScratchPoint',
  'assertValidScratchProgress',
  'createScratchCard',
  'createScratchProgressTracker',
  'validateScratchCardConfiguration',
].sort();

if (
  JSON.stringify(scratchCardRuntimeExports) !== JSON.stringify(expectedScratchCardRuntimeExports)
) {
  throw new Error('The core Scratch Card subpath runtime exports do not match its allowlist.');
}

const coreSlotMachine = await import(
  pathToFileURL(join(repositoryRoot, 'packages/core/dist/slot-machine/index.js')).href
);
const slotMachineRuntimeExports = Object.keys(coreSlotMachine).sort();
const expectedSlotMachineRuntimeExports = [
  'assertValidSlotMachineConfiguration',
  'assertValidSlotMachineSelection',
  'assertValidSlotSymbols',
  'createDefaultSlotPaylines',
  'createRandomSlotSelection',
  'createSlotMachine',
  'evaluateSlotPaylines',
  'selectSlotSymbol',
  'validateSlotMachineConfiguration',
  'validateSlotSymbols',
].sort();

if (
  JSON.stringify(slotMachineRuntimeExports) !== JSON.stringify(expectedSlotMachineRuntimeExports)
) {
  throw new Error('The core Slot Machine subpath runtime exports do not match its allowlist.');
}

console.log('All public package export maps and Phase 4 runtime entrypoints are valid.');
