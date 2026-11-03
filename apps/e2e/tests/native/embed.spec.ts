import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { completedRegion, nativeGame, nativeGames, openEmbed, watchForErrors } from './games.js';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function violations(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return result.violations.map((violation) => ({
    id: violation.id,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
}

test.describe('native embed routes', () => {
  for (const game of nativeGames) {
    test(`${game.title} renders without gallery chrome and completes a round`, async ({ page }) => {
      const errors = watchForErrors(page);
      await openEmbed(page, game);
      // The gallery's stack header (an h1 with the game title) is hidden in the embed.
      await expect(page.getByRole('heading', { level: 1, name: game.title })).toHaveCount(0);
      await game.play(page);
      await expect(completedRegion(page, game.completed)).toHaveCount(1, { timeout: 20_000 });
      expect(errors).toEqual([]);
    });

    test(`${game.title} has no axe WCAG 2 A/AA violations before and after a round`, async ({
      page,
    }) => {
      test.fail(game.axeDefect !== undefined, game.axeDefect);
      await openEmbed(page, game);
      const before = await violations(page);
      await game.play(page);
      await expect(completedRegion(page, game.completed)).toHaveCount(1, { timeout: 20_000 });
      const after = await violations(page);
      expect({ after, before }).toEqual({ after: [], before: [] });
    });
  }

  test('Scratch Card loads CanvasKit from the export and reveals by pointer scratching', async ({
    page,
  }) => {
    const errors = watchForErrors(page);
    const wasm = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith('/canvaskit.wasm'),
    );
    await openEmbed(page, nativeGame('scratch-card'));
    const response = await wasm;
    // Served by this origin from the exported assets, never from a CDN.
    expect(new URL(response.url()).origin).toBe(new URL(page.url()).origin);
    expect(new URL(response.url()).pathname).toBe('/canvaskit.wasm');
    expect(response.status()).toBe(200);

    const surface = page.getByRole('button', { name: 'Scratch Card', exact: true });
    const canvas = surface.locator('canvas').first();
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    if (box === null) throw new Error('Scratch canvas has no layout box.');
    await page.mouse.move(box.x + 4, box.y + 4);
    await page.mouse.down();
    for (let row = 6; row < box.height; row += 12) {
      await page.mouse.move(box.x + box.width - 4, box.y + row, { steps: 8 });
      await page.mouse.move(box.x + 4, box.y + row + 6, { steps: 8 });
    }
    await page.mouse.up();
    await expect(completedRegion(page, /^Result ID: points$/)).toHaveCount(1, { timeout: 20_000 });
    expect(errors).toEqual([]);
  });

  test('every game route serves the frame-ancestors policy from vercel.json', async ({
    request,
  }) => {
    for (const game of nativeGames) {
      const response = await request.get(`/embed/${game.slug}`);
      expect(response.status()).toBe(200);
      const policy = response.headers()['content-security-policy'] ?? '';
      expect(policy).toContain("frame-ancestors 'self' https://jackpotkit.vercel.app");
      expect(response.headers()['x-frame-options']).toBeUndefined();
    }
  });

  test('fits a 390 px frame without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ height: 800, width: 390 });
    for (const game of nativeGames) {
      await openEmbed(page, game);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, game.title).toBeLessThanOrEqual(0);
    }
  });
});

test.describe('gallery routes are unchanged', () => {
  test('the gallery index links to every game', async ({ page }) => {
    const errors = watchForErrors(page);
    await page.goto('/');
    await expect(page.getByText('Game Gallery', { exact: true })).toBeVisible();
    for (const game of nativeGames) {
      await expect(page.getByText(game.title, { exact: true }).first()).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('a game route keeps its stack header', async ({ page }) => {
    await page.goto('/spin-wheel');
    await expect(page.getByRole('heading', { level: 1, name: 'Spin Wheel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Spin', exact: true })).toBeVisible();
  });
});
