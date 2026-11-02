import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { docsGames, logEntries, openPlayground, preview, reduceMotion } from './playground.js';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function violations(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return result.violations.map((violation) => ({
    id: violation.id,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
}

/**
 * Whole-page scans of every game page: site chrome, MDX content, the playground controls, and the
 * real component, before and after a round. "Match site" renders the default theme in light mode
 * and neon in dark mode; the explicit choices cover the opposite pairings.
 */
const cases = [
  { label: 'light site, matching theme', scheme: 'light', theme: undefined },
  { label: 'dark site, matching theme', scheme: 'dark', theme: undefined },
  { label: 'light site, neon theme', scheme: 'light', theme: 'neon' },
  { label: 'dark site, default theme', scheme: 'dark', theme: 'default' },
] as const;

test.describe('docs playground axe WCAG 2 A/AA', () => {
  for (const variant of cases) {
    test.describe(variant.label, () => {
      test.use({ colorScheme: variant.scheme });

      for (const game of docsGames) {
        test(`${game.name} page has no violations before and after a round`, async ({ page }) => {
          const playground = await openPlayground(page, game.id);
          if (variant.theme !== undefined)
            await playground.getByLabel('Theme').selectOption(variant.theme);
          const before = await violations(page);
          await reduceMotion(playground);
          await game.play(preview(playground));
          await expect(logEntries(playground, game.event).first()).toBeVisible();
          const after = await violations(page);
          expect({ after, before }).toEqual({ after: [], before: [] });
        });
      }
    });
  }
});
