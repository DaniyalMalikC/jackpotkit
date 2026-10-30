import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { gameCard, games, openGallery } from './games.js';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Library accessibility defects found by this suite. Each one is a genuine `@jackpotkit/react`
 * defect, not a gallery issue, so it is reported rather than suppressed: the affected checks are
 * marked `test.fail()` and will start "unexpectedly passing" once the renderer is fixed, at which
 * point the entry must be removed.
 *
 * - Dice: each die face is a `<div aria-label="D6: n">` with no role. `aria-label` is prohibited on
 *   generic elements (axe `aria-prohibited-attr`, WCAG 4.1.2), so assistive technology may ignore
 *   the value. Source: `packages/react/src/dice/dice.tsx` (die face element). Fix: give the face
 *   `role="img"`, or render the value as visually hidden text.
 * - Slot Machine: the spin button's `aria-label="Spin reels"` does not contain its visible text
 *   "PULL TO SPIN" (axe `label-content-name-mismatch`, WCAG 2.5.3 Label in Name), which breaks
 *   speech-input users. Source: `packages/react/src/slot-machine/slot-machine.tsx` (spin button).
 *   Fix: drop the `aria-label` or make it start with the visible text.
 */
const KNOWN_DEFECTS: Readonly<Record<string, string>> = {
  Dice: 'aria-prohibited-attr on die faces (packages/react/src/dice/dice.tsx)',
  'Slot Machine':
    'label-content-name-mismatch on the spin button (packages/react/src/slot-machine/slot-machine.tsx)',
};

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
    test.fail(true, `Known library defects: ${Object.values(KNOWN_DEFECTS).join('; ')}`);
    expect(await violations(page)).toEqual([]);
  });

  games.forEach((game, index) => {
    test(`${game.title} has no violations before and after a round`, async ({ page }) => {
      const defect = KNOWN_DEFECTS[game.title];
      test.fail(defect !== undefined, `Known library defect: ${defect ?? ''}`);
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
