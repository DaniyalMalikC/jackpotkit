import { defineConfig, devices, type Project } from '@playwright/test';

/**
 * Browser end-to-end suite for JackpotKit.
 *
 * Targets:
 * - `gallery` (default): the Vite gallery in `apps/web-example`, built and served with
 *   `vite preview`. Started automatically unless `GALLERY_BASE_URL` points at a running server.
 * - `docs`: reserved for the Fumadocs site (phase B1). Set `DOCS_BASE_URL` and add specs under
 *   `tests/docs/`; see `docs/maintainers/automation.md`.
 *
 * Environment variables:
 * - `GALLERY_BASE_URL`: use an already running gallery instead of starting `vite preview`.
 * - `E2E_BROWSERS`: comma-separated engines (`chromium`, `firefox`, `webkit`). Default `chromium`.
 * - `PW_CHROMIUM_PATH`: launch a preinstalled Chromium binary instead of the Playwright download.
 */

const isCI = process.env.CI !== undefined && process.env.CI !== '' && process.env.CI !== 'false';
const galleryPort = Number(process.env.GALLERY_PORT ?? 4173);
const galleryBaseURL = process.env.GALLERY_BASE_URL ?? `http://127.0.0.1:${galleryPort}`;
const chromiumPath = process.env.PW_CHROMIUM_PATH;

const engines = {
  chromium: {
    ...devices['Desktop Chrome'],
    ...(chromiumPath === undefined || chromiumPath === ''
      ? {}
      : { launchOptions: { executablePath: chromiumPath } }),
  },
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
} as const;

type Engine = keyof typeof engines;

const requestedEngines = (process.env.E2E_BROWSERS ?? 'chromium')
  .split(',')
  .map((engine) => engine.trim())
  .filter((engine): engine is Engine => engine in engines);

const projects: Project[] = requestedEngines.map((engine) => ({
  name: `gallery-${engine}`,
  testDir: './tests/gallery',
  use: { ...engines[engine], baseURL: galleryBaseURL },
}));

export default defineConfig({
  expect: { timeout: 10_000 },
  forbidOnly: isCI,
  fullyParallel: true,
  outputDir: './test-results',
  projects,
  reporter: isCI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }], ['github']]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  retries: isCI ? 1 : 0,
  testDir: './tests',
  timeout: 60_000,
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  ...(process.env.GALLERY_BASE_URL === undefined
    ? {
        webServer: {
          command: `pnpm --filter @jackpotkit/web-example exec vite preview --host 127.0.0.1 --port ${galleryPort} --strictPort`,
          reuseExistingServer: !isCI,
          stdout: 'ignore' as const,
          timeout: 60_000,
          url: galleryBaseURL,
        },
      }
    : {}),
  ...(isCI ? { workers: 2 } : {}),
});
