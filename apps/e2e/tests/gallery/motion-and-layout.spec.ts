import { expect, test } from '@playwright/test';

import { gameCard, games, openGallery, resultRegion } from './games.js';

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test.beforeEach(async ({ page }) => openGallery(page));

  test('the browser reports the reduced-motion preference', async ({ page }) => {
    expect(
      await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    ).toBe(true);
  });

  for (const game of games) {
    test(`${game.title} still completes with reduced motion`, async ({ page }) => {
      const card = gameCard(page, game.title);
      await game.play(page, card);
      // Reduced-motion animations use the theme's 160 ms duration, so completion must be quick.
      await expect(resultRegion(card)).toHaveText(game.completed, { timeout: 5_000 });
    });
  }
});

test.describe('mobile viewport', () => {
  test.use({ hasTouch: true, isMobile: false, viewport: { height: 844, width: 390 } });

  test('has no horizontal overflow at 390px', async ({ page }) => {
    await openGallery(page);
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(
      overflow.clientWidth,
    );
  });

  test('no game card extends past the viewport at 390px', async ({ page }) => {
    await openGallery(page);
    for (const game of games) {
      const box = await gameCard(page, game.title).boundingBox();
      expect(box, game.title).not.toBeNull();
      if (box === null) continue;
      expect(box.x, `${game.title} left edge`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${game.title} right edge`).toBeLessThanOrEqual(390);
    }
  });
});
