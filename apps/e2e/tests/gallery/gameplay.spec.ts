import { expect, test } from '@playwright/test';

import { gameCard, games, openGallery, resultRegion } from './games.js';

test.describe('gallery rendering', () => {
  test.beforeEach(async ({ page }) => openGallery(page));

  test('renders all seven games with their primary control and live region', async ({ page }) => {
    await expect(page.getByRole('article')).toHaveCount(games.length);
    for (const game of games) {
      const card = gameCard(page, game.title);
      await expect(card, `${game.title} card`).toBeVisible();
      await expect(card.getByRole('button', { name: game.control })).toBeVisible();
      await expect(resultRegion(card)).toHaveAttribute('aria-live', 'polite');
    }
  });

  test('reaches every game control with the Tab key', async ({ page, browserName }) => {
    // WebKit on macOS skips buttons on Tab unless "Full Keyboard Access" is on; Playwright's
    // WebKit honours the same default, so use Alt+Tab there.
    const key = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    const reached = new Set<string>();
    for (let step = 0; step < 80 && reached.size < games.length; step += 1) {
      await page.keyboard.press(key);
      const focused = await page.evaluate(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLElement)) return undefined;
        const title = element.closest('article')?.querySelector('h3')?.textContent ?? '';
        // Approximate the accessible name: aria-hidden decorations are not part of it.
        const visible = element.cloneNode(true) as HTMLElement;
        visible.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove());
        const name = element.getAttribute('aria-label') ?? visible.textContent ?? '';
        return { name: name.trim(), title };
      });
      if (focused === undefined) continue;
      const game = games.find((candidate) => candidate.title === focused.title);
      if (game !== undefined && game.focusable.test(focused.name)) reached.add(game.title);
    }
    expect([...reached].sort()).toEqual(games.map((game) => game.title).sort());
  });
});

test.describe('gameplay via keyboard', () => {
  test.beforeEach(async ({ page }) => openGallery(page));

  for (const game of games) {
    test(`${game.title} completes and announces its result`, async ({ page }) => {
      const card = gameCard(page, game.title);
      const status = resultRegion(card);
      await game.play(page, card);
      await expect(status).toHaveText(game.completed);
    });
  }

  test('Scratch Card reveals by pointer scratching', async ({ page }) => {
    const card = gameCard(page, 'Scratch Card');
    const canvas = card.locator('canvas');
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    if (box === null) throw new Error('Scratch canvas has no layout box.');
    await page.mouse.move(box.x + 4, box.y + 4);
    await page.mouse.down();
    for (let row = 8; row < box.height; row += 16) {
      await page.mouse.move(box.x + box.width - 4, box.y + row, { steps: 6 });
      await page.mouse.move(box.x + 4, box.y + row + 8, { steps: 6 });
    }
    await page.mouse.up();
    await expect(resultRegion(card)).toHaveText(/^Prize revealed$/);
  });

  test('controls are disabled while a round is in progress', async ({ page }) => {
    const card = gameCard(page, 'Spin Wheel');
    await card.getByRole('button', { name: /^Spin$/ }).click();
    await expect(card.getByRole('button', { name: 'Spinning…' })).toBeDisabled();
    await expect(resultRegion(card)).toHaveText(/^Selected: /);
    await expect(card.getByRole('button', { name: /^Spin$/ })).toBeEnabled();
  });
});

test.describe('reset', () => {
  // The renderers expose `reset()` through their imperative refs, and the gallery renders no reset
  // control for any game. Reset behaviour is covered by the React unit tests; this placeholder
  // becomes a real check once the gallery or the docs playground (phase B2) exposes a reset button.
  test.fixme('resets each game through a visible reset control', () => {
    // Pending a reset control in the gallery or the docs playground.
  });

  test('a reload returns every game to its initial state', async ({ page }) => {
    await openGallery(page);
    const dice = gameCard(page, 'Dice');
    await dice.getByRole('button', { name: /^Roll dice$/ }).click();
    await expect(resultRegion(dice)).toHaveText(/^Total: /);
    await page.reload();
    for (const game of games) {
      const status = resultRegion(gameCard(page, game.title));
      if (game.title === 'Scratch Card') await expect(status).toHaveText('0% scratched');
      else await expect(status).toHaveText('');
    }
  });
});
