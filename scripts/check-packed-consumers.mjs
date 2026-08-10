import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repositoryRoot = resolve(import.meta.dirname, '..');
const fixtureRoot = mkdtempSync(join(tmpdir(), 'jackpotkit-packed-consumer-'));

function run(command, arguments_, cwd) {
  const result = spawnSync(command, arguments_, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, COREPACK_ENABLE_PROJECT_SPEC: '0' },
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${arguments_.join(' ')} failed.\n${result.stdout}\n${result.stderr}`,
    );
  }

  return result.stdout;
}

function pack(directory) {
  const destination = join(fixtureRoot, directory);
  run('mkdir', ['-p', destination], fixtureRoot);
  run(
    'corepack',
    ['pnpm', 'pack', '--pack-destination', destination],
    join(repositoryRoot, 'packages', directory),
  );

  const archives = readdirSync(destination).filter((filename) => filename.endsWith('.tgz'));

  if (archives.length !== 1) {
    throw new Error(`Expected one ${directory} archive, received ${archives.length}.`);
  }

  return join(destination, archives[0]);
}

try {
  const coreArchive = pack('core');
  const testingArchive = pack('testing');

  writeFileSync(
    join(fixtureRoot, 'package.json'),
    JSON.stringify({ name: 'jackpotkit-packed-consumer', private: true, type: 'module' }),
  );
  run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-package-lock',
      coreArchive,
      testingArchive,
    ],
    fixtureRoot,
  );

  writeFileSync(
    join(fixtureRoot, 'smoke.mjs'),
    `import { SeededRandomSource, nextRandomValue, resolveResult } from '@jackpotkit/core';
import { MockResultProvider, SequenceRandomSource, createGameResult } from '@jackpotkit/testing';

const first = new SeededRandomSource('packed-consumer');
const second = new SeededRandomSource('packed-consumer');
if (nextRandomValue(first) !== nextRandomValue(second)) throw new Error('Seed sequence changed.');

const sequence = new SequenceRandomSource([0.25]);
if (nextRandomValue(sequence) !== 0.25) throw new Error('Testing package did not resolve core.');

const expected = createGameResult({ data: { rewardId: 'badge' } });
const provider = new MockResultProvider({ result: expected });
const actual = await resolveResult(provider.provide, { campaignId: 'smoke' });
if (actual !== expected || provider.calls !== 1) throw new Error('Result provider smoke test failed.');
`,
  );

  run(process.execPath, ['smoke.mjs'], fixtureRoot);
  console.log('Packed core and testing packages install and run in an isolated consumer.');
} finally {
  rmSync(fixtureRoot, { force: true, recursive: true });
}
