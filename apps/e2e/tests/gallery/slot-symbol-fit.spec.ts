import { expect, test } from '@playwright/test';

/**
 * Default Slot Machine symbol text must fit its cell. The gallery card uses emoji, so this spec
 * renders the `slot-labels` fixture (`apps/web-example/src/fixtures.tsx`): `createSlotSymbols(4)`
 * text labels ("Symbol 1"..."Symbol 4") at 3 reels / 380px and 5 reels / 320px.
 */
const layouts = ['3x380', '5x320'] as const;

interface CellOverflow {
  readonly clientHeight: number;
  readonly clientWidth: number;
  readonly scrollHeight: number;
  readonly scrollWidth: number;
  readonly text: string;
}

test.describe('Slot Machine text labels', () => {
  for (const layout of layouts) {
    test(`fit their cells at ${layout.replace('x', ' reels / ')}px`, async ({ page }) => {
      await page.goto('/?fixture=slot-labels');
      const section = page.locator(`[data-fixture-layout="${layout}"]`);
      await expect(section.locator('[data-jackpotkit-slot-reel]').first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const cells = await section
        .locator('[data-jackpotkit-slot-strip] > div')
        .evaluateAll((elements) =>
          elements.map((element) => ({
            clientHeight: element.clientHeight,
            clientWidth: element.clientWidth,
            scrollHeight: element.scrollHeight,
            scrollWidth: element.scrollWidth,
            text: element.textContent ?? '',
          })),
        );

      expect(cells.length).toBeGreaterThan(0);
      expect(cells.every((cell) => /^Symbol \d$/.test(cell.text))).toBe(true);
      const clipped = cells.filter(
        (cell: CellOverflow) =>
          cell.scrollWidth > cell.clientWidth + 1 || cell.scrollHeight > cell.clientHeight + 1,
      );
      expect(
        clipped,
        `${clipped.length} of ${cells.length} cells clip: ${JSON.stringify(clipped[0])}`,
      ).toEqual([]);
    });
  }
});
