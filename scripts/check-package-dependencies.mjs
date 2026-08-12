import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const packages = ['core', 'react-native', 'react', 'theme', 'testing'];
const allowedDependencies = {
  core: [],
  'react-native': ['@jackpotkit/core', '@jackpotkit/theme'],
  react: ['@jackpotkit/core', '@jackpotkit/theme'],
  theme: [],
  testing: ['@jackpotkit/core'],
};
const allowedPeers = {
  core: [],
  'react-native': [
    '@shopify/react-native-skia',
    'react',
    'react-native',
    'react-native-gesture-handler',
    'react-native-reanimated',
    'react-native-svg',
    'react-native-worklets',
  ],
  react: ['react', 'react-dom'],
  theme: [],
  testing: [],
};

function sortedKeys(value) {
  return Object.keys(value ?? {}).sort();
}

for (const directory of packages) {
  const manifest = JSON.parse(
    readFileSync(join(repositoryRoot, 'packages', directory, 'package.json'), 'utf8'),
  );
  const dependencies = sortedKeys(manifest.dependencies);
  const peers = sortedKeys(manifest.peerDependencies);

  if (JSON.stringify(dependencies) !== JSON.stringify(allowedDependencies[directory])) {
    throw new Error(
      `${manifest.name} runtime dependencies changed without a dependency-review update: ${dependencies.join(', ') || 'none'}`,
    );
  }
  if (JSON.stringify(peers) !== JSON.stringify(allowedPeers[directory])) {
    throw new Error(
      `${manifest.name} peer dependencies changed without a dependency-review update: ${peers.join(', ') || 'none'}`,
    );
  }

  for (const [name, range] of Object.entries(manifest.dependencies ?? {})) {
    if (name.startsWith('@jackpotkit/') && range !== 'workspace:^') {
      throw new Error(
        `${manifest.name} must use workspace:^ for internal runtime dependency ${name}.`,
      );
    }
  }

  for (const hook of ['preinstall', 'install', 'postinstall', 'prepublish', 'prepublishOnly']) {
    if (manifest.scripts?.[hook] !== undefined) {
      throw new Error(`${manifest.name} must not publish lifecycle script ${hook}.`);
    }
  }

  if (manifest.sideEffects !== false)
    throw new Error(`${manifest.name} must remain tree-shakeable.`);
  if (manifest.license !== 'MIT') throw new Error(`${manifest.name} must declare the MIT license.`);
  if (manifest.publishConfig?.access !== 'public' || manifest.publishConfig?.provenance !== true) {
    throw new Error(`${manifest.name} must publish publicly with provenance enabled.`);
  }
}

console.log(
  'Published-package dependency allowlists, peer ranges, lifecycle scripts, and provenance metadata are valid.',
);
