import { expect, test } from '@playwright/test';

import { docsGames, openPlayground, preview } from './playground.js';

test.describe('docs playground at 390 px', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  for (const game of docsGames) {
    test(`${game.name} has no horizontal page overflow`, async ({ page }) => {
      const playground = await openPlayground(page, game.id);
      for (const width of ['Full', 'Tablet 768', 'Mobile 360']) {
        await playground.getByRole('radio', { name: width }).check({ force: true });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${width} preview`).toBeLessThanOrEqual(0);
      }
      const box = await playground.boundingBox();
      expect(box).not.toBeNull();
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
      await expect(preview(playground).getByRole('status')).toHaveCount(1);
    });
  }
});

test('the preview honours prefers-reduced-motion through the library', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const playground = await openPlayground(page, 'spin-wheel');
  const started = Date.now();
  await preview(playground)
    .getByRole('button', { name: /^Spin$/ })
    .click();
  await expect(preview(playground).getByRole('status')).toHaveText(/^Selected: /);
  // The default spin is 3000 ms; reduced motion uses the 160 ms theme duration.
  expect(Date.now() - started).toBeLessThan(2500);
});
