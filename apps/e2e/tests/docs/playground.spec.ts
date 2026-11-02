import { expect, test } from '@playwright/test';

import {
  code,
  docsGames,
  logEntries,
  openPlayground,
  preview,
  reduceMotion,
} from './playground.js';

test.describe('docs playground', () => {
  for (const game of docsGames) {
    test(`${game.name} page loads without console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      const playground = await openPlayground(page, game.id);
      await expect(playground.getByTestId('playground-error')).toHaveCount(0);
      await expect(logEntries(playground, 'onReady')).toHaveCount(1);
      expect(errors).toEqual([]);
    });

    test(`${game.name} plays with the keyboard and logs ${game.event}`, async ({ page }) => {
      const playground = await openPlayground(page, game.id);
      await reduceMotion(playground);
      await game.play(preview(playground));
      await expect(logEntries(playground, game.event).first()).toBeVisible();
      await expect(playground.getByTestId('event-log-announcer')).toHaveText(/new event/);
    });
  }

  test('changing a control updates the generated code', async ({ page }) => {
    const playground = await openPlayground(page, 'spin-wheel');
    await expect(code(playground)).toContainText('size={260}');
    await playground.getByLabel('Size value').fill('300');
    await expect(code(playground)).toContainText('size={300}');
    await playground.getByLabel('Direction').selectOption({ label: 'Counter-clockwise' });
    await expect(code(playground)).toContainText('direction="counter-clockwise"');
    await playground.getByRole('radio', { name: 'Controlled' }).check();
    await expect(code(playground)).toContainText(
      "const result = { segmentId: 'points' } as const;",
    );
  });

  test('a select control updates the Dice code and preview', async ({ page }) => {
    const playground = await openPlayground(page, 'dice');
    await playground.getByLabel('Sides').selectOption({ label: 'D20' });
    await expect(code(playground)).toContainText('sides={20}');
    await expect(
      preview(playground)
        .getByRole('img', { name: /^D20: / })
        .first(),
    ).toBeVisible();
  });

  for (const [game, outcome, label, expected] of [
    ['spin-wheel', 'Winning segment', 'Bonus', /^Selected: Bonus$/],
    ['coin-flip', 'Winning face', 'Tails', /^Result: Tails$/],
  ] as const) {
    test(`controlled result mode yields the chosen ${game} outcome`, async ({ page }) => {
      const playground = await openPlayground(page, game);
      await reduceMotion(playground);
      await playground.getByRole('radio', { name: 'Controlled' }).check();
      await playground.getByLabel(outcome).selectOption({ label });
      for (let round = 0; round < 3; round += 1) {
        await playground.getByRole('button', { name: 'Reset game' }).click();
        await docsGames.find((candidate) => candidate.id === game)?.play(preview(playground));
        await expect(preview(playground).getByRole('status')).toHaveText(expected);
      }
    });
  }

  test('a failing server provider reports onError', async ({ page }) => {
    const playground = await openPlayground(page, 'spin-wheel');
    await playground.getByRole('radio', { name: 'Server provider' }).check();
    await playground.getByLabel(/^Server delay/).fill('0');
    await playground.getByRole('checkbox', { name: 'Fail the request (calls onError)' }).check();
    await expect(code(playground)).toContainText("reject(new Error('Simulated server failure'))");
    await preview(playground)
      .getByRole('button', { name: /^Spin$/ })
      .click();
    const error = logEntries(playground, 'onError');
    await expect(error).toHaveCount(1);
    // The library wraps provider failures in ResultProviderError; the log keeps the cause.
    await expect(error).toContainText('ResultProviderError');
    await expect(error).toContainText('Simulated server failure');
    await expect(logEntries(playground, 'onComplete')).toHaveCount(0);
  });

  test('a successful server provider resolves the chosen outcome', async ({ page }) => {
    const playground = await openPlayground(page, 'spin-wheel');
    await reduceMotion(playground);
    await playground.getByRole('radio', { name: 'Server provider' }).check();
    await playground.getByLabel('Winning segment').selectOption({ label: 'Streak' });
    await preview(playground)
      .getByRole('button', { name: /^Spin$/ })
      .click();
    await expect(logEntries(playground, 'onResultRequest')).toHaveCount(1);
    await expect(preview(playground).getByRole('status')).toHaveText('Selected: Streak');
  });

  test('reset returns the game to its initial state', async ({ page }) => {
    const playground = await openPlayground(page, 'spin-wheel');
    const initialCode = await code(playground).textContent();
    await reduceMotion(playground);
    const status = preview(playground).getByRole('status');
    await preview(playground)
      .getByRole('button', { name: /^Spin$/ })
      .click();
    await expect(status).toHaveText(/^Selected: /);
    await playground.getByRole('button', { name: 'Reset game' }).click();
    await expect(status).toHaveText('');
    await expect(preview(playground).getByRole('button', { name: /^Spin$/ })).toBeEnabled();
    await expect(logEntries(playground, 'onReset')).toHaveCount(1);

    // Restore defaults also returns every control and the generated code to the initial state.
    await playground.getByLabel('Size value').fill('200');
    await expect(code(playground)).not.toHaveText(initialCode ?? '');
    await playground.getByRole('button', { name: 'Restore defaults' }).click();
    await expect(code(playground)).toHaveText(initialCode ?? '');
  });

  test('a seeded replay repeats the same result after remounting', async ({ page }) => {
    const playground = await openPlayground(page, 'dice');
    await reduceMotion(playground);
    await playground.getByLabel('Seed (optional)').fill('docs-e2e');
    const status = preview(playground).getByRole('status');
    await preview(playground)
      .getByRole('button', { name: /^Roll dice$/ })
      .click();
    await expect(status).toHaveText(/^Total: \d+$/);
    const first = await status.textContent();
    await playground.getByRole('button', { name: 'Remount' }).click();
    await preview(playground)
      .getByRole('button', { name: /^Roll dice$/ })
      .click();
    await expect(status).toHaveText(first ?? '');
  });

  test('library validation errors are shown instead of crashing', async ({ page }) => {
    const playground = await openPlayground(page, 'spin-wheel');
    await playground.getByLabel('Segment 2 id').fill('points');
    await expect(playground.getByRole('alert')).toBeVisible();
    await expect(playground.getByTestId('playground-error')).toContainText(/points/);
    await playground.getByLabel('Segment 2 id').fill('badge');
    await expect(playground.getByRole('alert')).toHaveCount(0);
    await expect(preview(playground).getByRole('button', { name: /^Spin$/ })).toBeVisible();
  });

  test('the event log can be cleared', async ({ page }) => {
    const playground = await openPlayground(page, 'coin-flip');
    await expect(logEntries(playground)).not.toHaveCount(0);
    await playground.getByRole('button', { name: 'Clear log' }).click();
    await expect(logEntries(playground)).toHaveCount(0);
  });

  test('the playground bundle is not loaded on pages without a playground', async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', async (response) => {
      if (response.request().resourceType() === 'script') scripts.push(await response.text());
    });
    await page.goto('/docs/accessibility');
    await page.waitForLoadState('networkidle');
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.filter((source) => source.includes('Simulated server failure'))).toEqual([]);
  });
});
