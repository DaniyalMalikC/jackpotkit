import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repositoryRoot = resolve(import.meta.dirname, '..');
const fixtureRoot = mkdtempSync(join(tmpdir(), 'jackpotkit-packed-consumer-'));

function run(command, arguments_, cwd) {
  const result = spawnSync(command, arguments_, {
    cwd,
    encoding: 'utf8',
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
  mkdirSync(destination, { recursive: true });
  run(
    'pnpm',
    ['pack', '--pack-destination', destination],
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
  const reactArchive = pack('react');
  const themeArchive = pack('theme');
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
      reactArchive,
      themeArchive,
      testingArchive,
      'react@19.2.3',
      'react-dom@19.2.3',
    ],
    fixtureRoot,
  );

  writeFileSync(
    join(fixtureRoot, 'smoke.mjs'),
    `import { SeededRandomSource, nextRandomValue, resolveResult } from '@jackpotkit/core';
import { createScratchCard, createScratchProgressTracker } from '@jackpotkit/core/scratch-card';
import { createBingo } from '@jackpotkit/core/bingo';
import { createCoinFlip } from '@jackpotkit/core/coin-flip';
import { createDice } from '@jackpotkit/core/dice';
import { createLuckyBox } from '@jackpotkit/core/lucky-box';
import { createSlotMachine } from '@jackpotkit/core/slot-machine';
import { createSpinWheel } from '@jackpotkit/core/spin-wheel';
import { createBingoBoardFixture, createCoinFaces, createDiceFixture, createLuckyBoxes, createScratchCardSelection, createSlotSymbols, createWheelSegments, MockResultProvider, SequenceRandomSource, createGameResult } from '@jackpotkit/testing';
import { createJackpotTheme, neonTheme } from '@jackpotkit/theme';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Bingo } from '@jackpotkit/react/bingo';
import { CoinFlip } from '@jackpotkit/react/coin-flip';
import { Dice } from '@jackpotkit/react/dice';
import { LuckyBox } from '@jackpotkit/react/lucky-box';
import { ScratchCard } from '@jackpotkit/react/scratch-card';
import { SlotMachine } from '@jackpotkit/react/slot-machine';
import { SpinWheel } from '@jackpotkit/react/spin-wheel';

const first = new SeededRandomSource('packed-consumer');
const second = new SeededRandomSource('packed-consumer');
if (nextRandomValue(first) !== nextRandomValue(second)) throw new Error('Seed sequence changed.');

const sequence = new SequenceRandomSource([0.25]);
if (nextRandomValue(sequence) !== 0.25) throw new Error('Testing package did not resolve core.');

const expected = createGameResult({ data: { rewardId: 'badge' } });
const provider = new MockResultProvider({ result: expected });
const actual = await resolveResult(provider.provide, { campaignId: 'smoke' });
if (actual !== expected || provider.calls !== 1) throw new Error('Result provider smoke test failed.');

const segments = createWheelSegments(3, (index) => ({ weight: index + 1 }));
const wheel = createSpinWheel({ segments, randomSource: new SequenceRandomSource([0.99]) });
if (wheel.spin().segmentId !== 'segment-3') throw new Error('Spin Wheel subpath failed.');

const selection = createScratchCardSelection({ id: 'bonus', amount: 250 });
const card = createScratchCard({ result: selection, threshold: 0.5 });
const tracker = createScratchProgressTracker({ width: 100, height: 50, brushRadius: 12 });
card.start();
card.scratch(tracker.scratchLine({ x: 0, y: 25 }, { x: 100, y: 25 }));
const scratchResult = card.reveal();
if (scratchResult.prize?.id !== 'bonus') throw new Error('Scratch Card subpath failed.');

const slotSymbols = createSlotSymbols(2);
const machine = createSlotMachine({ symbols: slotSymbols, reelCount: 2, rowCount: 1 });
const slotResult = machine.spinTo({ reels: [['symbol-2'], ['symbol-2']] });
if (slotResult.winningPaylines[0]?.symbolId !== 'symbol-2') throw new Error('Slot Machine subpath failed.');

const bingo = createBingo({ board: createBingoBoardFixture(3), maxNumber: 9, size: 3 });
for (const number of [1, 4, 7]) {
  bingo.call(number);
  bingo.mark(number);
}
if (!bingo.check().completed) throw new Error('Bingo subpath failed.');

const dice = createDice({ dice: createDiceFixture(2, 6) });
if (dice.rollTo({ values: [2, 6] }).total !== 8) throw new Error('Dice subpath failed.');

const coin = createCoinFlip({ faces: createCoinFaces(['day', 'night']) });
if (coin.flipTo({ faceId: 'tails' }).face.value !== 'night') throw new Error('Coin Flip subpath failed.');

const lucky = createLuckyBox({ boxes: createLuckyBoxes(2, (index) => ({ reward: index })) });
lucky.select('box-1');
if (!lucky.revealTo({ boxId: 'box-1' }).won) throw new Error('Lucky Box subpath failed.');

const customTheme = createJackpotTheme({ colors: { primary: '#123456' } }, neonTheme);
if (customTheme.colors.primary !== '#123456') throw new Error('Theme package failed.');

const webRenderers = [
  React.createElement(SpinWheel, { segments, size: 180 }),
  React.createElement(Dice, { count: 2, width: 240 }),
  React.createElement(CoinFlip, { size: 120 }),
  React.createElement(LuckyBox, { boxes: createLuckyBoxes(3), width: 240 }),
  React.createElement(SlotMachine, { symbols: slotSymbols, reelCount: 2, rowCount: 1, width: 240 }),
  React.createElement(ScratchCard, { height: 100, result: selection, width: 200 }, 'Prize'),
  React.createElement(Bingo, { board: createBingoBoardFixture(3), maxNumber: 9, size: 3, width: 240 }),
];
for (const renderer of webRenderers) {
  if (renderToString(renderer).length === 0) throw new Error('React SSR renderer produced no markup.');
}
`,
  );

  run(process.execPath, ['smoke.mjs'], fixtureRoot);
  console.log(
    'Packed core, React, theme, and testing packages install, SSR-render, and run in an isolated consumer.',
  );
} finally {
  rmSync(fixtureRoot, { force: true, recursive: true });
}
