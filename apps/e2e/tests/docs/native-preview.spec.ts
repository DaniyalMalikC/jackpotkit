import { expect, test, type Page } from '@playwright/test';

import { docsGames } from './playground.js';

/**
 * The docs embed the Expo gallery's web export (`apps/expo-example`, served by the `native`
 * project's static server). The docs build inlines `NEXT_PUBLIC_NATIVE_PREVIEW_URL`; CI builds
 * them against the local server. When the build points elsewhere (the production default), the
 * test routes that origin to the local server so the frame still renders the real export.
 */
const nativePort = Number(process.env.NATIVE_PORT ?? 4174);
const localNative = process.env.NATIVE_BASE_URL ?? `http://127.0.0.1:${nativePort}`;
const configured = (
  process.env.NEXT_PUBLIC_NATIVE_PREVIEW_URL || 'https://jackpotkit-native.vercel.app'
).replace(/\/+$/, '');

async function routeToLocalNative(page: Page): Promise<void> {
  if (new URL(configured).origin === new URL(localNative).origin) return;
  await page.route(`${configured}/**`, async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${localNative}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
}

test.describe('React Native preview', () => {
  for (const game of docsGames) {
    test(`${game.name} loads its embed only after the button is pressed`, async ({ page }) => {
      await routeToLocalNative(page);
      await page.goto(`/docs/${game.id}`);
      const preview = page.locator(`[data-native-preview="${game.id}"]`);
      await expect(
        page.getByRole('heading', { level: 2, name: 'React Native preview' }),
      ).toBeVisible();
      await expect(preview.locator('iframe')).toHaveCount(0);

      const button = preview.getByRole('button', { name: 'Load React Native preview' });
      await button.focus();
      await button.press('Enter');

      const frame = preview.locator('iframe');
      await expect(frame).toHaveAttribute('src', `${configured}/embed/${game.id}`);
      await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin');
      await expect(frame).toHaveAttribute(
        'title',
        new RegExp(`^${game.name} React Native preview`),
      );
      await expect(frame).toBeFocused();
      await expect(
        preview.getByRole('link', { name: 'Open the preview in a new tab' }),
      ).toHaveAttribute('href', `${configured}/embed/${game.id}`);
    });
  }

  test('the Spin Wheel frame renders the React Native playground and completes a spin', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await routeToLocalNative(page);
    await page.goto('/docs/spin-wheel');
    const preview = page.locator('[data-native-preview="spin-wheel"]');
    await preview.getByRole('button', { name: 'Load React Native preview' }).click();

    const frame = preview.frameLocator('iframe');
    const spin = frame.getByRole('button', { name: 'Spin the example wheel' });
    await expect(spin).toBeVisible({ timeout: 30_000 });
    await spin.click();
    await expect(
      frame.locator('[aria-live="polite"]').filter({ hasText: /^Result ID: \w+$/ }),
    ).toHaveCount(1, { timeout: 20_000 });
    expect(errors).toEqual([]);
  });

  test('the playground caption links to the React Native preview', async ({ page }) => {
    await page.goto('/docs/dice');
    const link = page.locator('[data-playground="dice"]').getByRole('link', {
      name: 'React Native preview',
    });
    await expect(link).toHaveAttribute('href', '#react-native-preview');
    await expect(page.locator('#react-native-preview')).toHaveCount(1);
  });
});
