import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repositoryRoot = resolve(import.meta.dirname, '..');
const packageDirectories = ['core', 'react-native', 'react', 'theme', 'testing'];
const forbiddenPatterns = [
  /(?:^|\/)__tests__(?:\/|$)/,
  /\.(?:spec|test)\.[cm]?[jt]sx?$/,
  /\.env(?:\.|$)/,
  /(?:^|\/)(?:credentials?|secrets?)(?:\.|\/|$)/i,
  /\.(?:key|p12|pem)$/i,
  /(?:^|\/)(?:\.npmrc|\.pnpmfile\.cjs)$/,
  /JackpotKit.*\.(?:docx|md|pdf)$/i,
  /(?:^|\/)coverage(?:\/|$)/,
  /(?:^|\/)node_modules(?:\/|$)/,
  /(?:^|\/)(?:tmp|temp)(?:\/|$)/i,
  /(?:\.tmp|\.temp|\.swp|~)$/i,
];

for (const directory of packageDirectories) {
  const packageRoot = join(repositoryRoot, 'packages', directory);
  const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const result = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: packageRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`npm pack failed for ${packageJson.name}:\n${result.stderr}`);
  }

  const [packResult] = JSON.parse(result.stdout);
  const filenames = packResult.files.map((file) => file.path);
  const artifactAllowlist = ['package.json', ...packageJson.files];

  for (const filename of filenames) {
    const isAllowlisted = artifactAllowlist.some(
      (entry) => filename === entry || filename.startsWith(`${entry}/`),
    );

    if (!isAllowlisted) {
      throw new Error(`${packageJson.name} would publish non-allowlisted file: ${filename}`);
    }
  }

  for (const filename of filenames) {
    if (forbiddenPatterns.some((pattern) => pattern.test(filename))) {
      throw new Error(`${packageJson.name} would publish forbidden file: ${filename}`);
    }
  }

  for (const requiredFile of ['LICENSE', 'README.md', 'package.json']) {
    if (!filenames.includes(requiredFile)) {
      throw new Error(`${packageJson.name} pack is missing ${requiredFile}.`);
    }
  }
}

console.log('All public package dry-run contents are valid.');
