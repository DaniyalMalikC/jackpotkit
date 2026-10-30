import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { gameCard, games, openGallery } from './games.js';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function violations(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (include !== undefined) builder = builder.include(include);
  const result = await builder.analyze();
  return result.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
}

function cardSelector(index: number): string {
  return `.game-grid > article:nth-of-type(${index + 1})`;
}

// The gallery has no theme toggle and renders only the default light theme, so one theme is
// scanned. Add a scan per theme once a toggle exists (the docs playground, phase B2, adds one).
test.describe('axe WCAG 2 A/AA', () => {
  test.beforeEach(async ({ page }) => openGallery(page));

  test('page chrome outside the game cards has no violations', async ({ page }) => {
    const result = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .exclude('.game-grid > article')
      .analyze();
    expect(result.violations.map((violation) => violation.id)).toEqual([]);
  });

  test('the whole gallery has no violations', async ({ page }) => {
    expect(await violations(page)).toEqual([]);
  });

  games.forEach((game, index) => {
    test(`${game.title} has no violations before and after a round`, async ({ page }) => {
      const card = gameCard(page, game.title);
      await expect(card).toHaveCount(1);
      // Guard the positional selector against gallery reordering.
      await expect(page.locator(cardSelector(index)).getByRole('heading', { level: 3 })).toHaveText(
        game.title,
      );
      const before = await violations(page, cardSelector(index));
      await game.play(page, card);
      await expect(card.getByRole('status')).toHaveText(game.completed);
      const after = await violations(page, cardSelector(index));
      expect({ after, before }).toEqual({ after: [], before: [] });
    });
  });
});
