import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Pages added by the documentation guides; the sitemap must list them. */
const requiredPages = [
  '/docs/installation',
  '/docs/quick-start',
  '/docs/troubleshooting',
  '/docs/theming',
  '/docs/recipes',
  '/docs/recipes/server-authoritative-rewards',
  '/docs/recipes/seeded-previews-and-testing',
  '/docs/recipes/controlled-outcomes',
  '/docs/recipes/analytics',
  '/docs/recipes/reduced-motion',
  '/docs/recipes/translating-labels',
  '/docs/animations-and-performance',
  '/docs/faq',
  '/docs/migration',
  '/docs/changelog',
  '/docs/contributing',
  '/docs/maintainers/backlog',
];

/** Every page in `sitemap.xml`, as a path, so new pages are covered without editing this file. */
async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1] ?? '').pathname);
}

test('the sitemap lists every guide page', async ({ request }) => {
  const paths = await sitemapPaths(request);
  expect(paths.length).toBeGreaterThan(40);
  expect(requiredPages.filter((path) => !paths.includes(path))).toEqual([]);
});

test('the Open Graph image is a static PNG referenced by the home and docs pages', async ({
  page,
  request,
}) => {
  const image = await request.get('/og.png');
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toBe('image/png');
  expect((await image.body()).subarray(1, 4).toString('latin1')).toBe('PNG');

  for (const path of ['/', '/docs/theming']) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/og\.png$/,
    );
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      'content',
      '1200',
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
  }
});

test.describe('every docs page', () => {
  // One test per scheme keeps the report short; the page list comes from the sitemap.
  for (const scheme of ['light', 'dark'] as const) {
    test(`loads without errors and has no axe violations (${scheme})`, async ({
      browser,
      baseURL,
      request,
    }) => {
      test.setTimeout(10 * 60_000);
      const paths = await sitemapPaths(request);
      const context = await browser.newContext({
        colorScheme: scheme,
        ...(baseURL === undefined ? {} : { baseURL }),
      });
      const page = await context.newPage();
      const problems: string[] = [];
      let current = '';
      page.on('console', (message) => {
        if (message.type() === 'error')
          problems.push(`${current}: console error: ${message.text()}`);
      });
      page.on('pageerror', (error) => problems.push(`${current}: page error: ${error.message}`));

      for (const path of paths) {
        current = path;
        const response = await page.goto(path);
        if (response?.status() !== 200) {
          problems.push(`${path}: HTTP ${response?.status() ?? 'no response'}`);
          continue;
        }
        await expect(page.locator('main, #nd-page').first()).toBeVisible();
        const result = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        for (const violation of result.violations) {
          problems.push(
            `${path}: ${violation.id} at ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
          );
        }
      }
      await context.close();
      expect(problems).toEqual([]);
    });
  }
});
