import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const coreRoot = join(repositoryRoot, 'packages/core');
const coreSourceRoot = join(coreRoot, 'src');
const bannedModules = [
  '@shopify/react-native-skia',
  'expo',
  'react',
  'react-native',
  'react-native-gesture-handler',
  'react-native-reanimated',
];
const bannedGlobals = ['document', 'navigator', 'window'];

function collectSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }

    return ['.ts', '.tsx'].includes(extname(entry.name)) ? [entryPath] : [];
  });
}

const packageJson = JSON.parse(readFileSync(join(coreRoot, 'package.json'), 'utf8'));
const runtimeDependencies = Object.keys(packageJson.dependencies ?? {});

if (runtimeDependencies.length > 0) {
  throw new Error(
    `@jackpotkit/core must have zero runtime dependencies; found ${runtimeDependencies.join(', ')}`,
  );
}

for (const filePath of collectSourceFiles(coreSourceRoot)) {
  if (!statSync(filePath).isFile()) continue;

  const source = readFileSync(filePath, 'utf8');
  const displayPath = relative(repositoryRoot, filePath);

  for (const moduleName of bannedModules) {
    const escapedModuleName = moduleName.replaceAll('/', '\\/');
    const importPattern = new RegExp(
      `(?:from\\s+|import\\s*\\(|require\\s*\\()(['\"])${escapedModuleName}(?:\\/[^'\"]*)?\\1`,
    );

    if (importPattern.test(source)) {
      throw new Error(`${displayPath} imports prohibited module ${moduleName}`);
    }
  }

  for (const globalName of bannedGlobals) {
    const globalPattern = new RegExp(`\\b${globalName}\\b`);
    if (globalPattern.test(source)) {
      throw new Error(`${displayPath} references prohibited DOM global ${globalName}`);
    }
  }
}

console.log('Core dependency and platform boundaries are valid.');
