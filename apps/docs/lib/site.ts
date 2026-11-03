/**
 * Canonical site origin used for metadata, the sitemap, and robots.txt.
 *
 * Set `SITE_URL` at build time (for example in Vercel project settings). The default is a
 * placeholder until the production domain is confirmed.
 */
export const siteUrl = (process.env.SITE_URL ?? 'https://jackpotkit.vercel.app').replace(
  /\/+$/,
  '',
);

export const siteName = 'JackpotKit';
export const siteTagline = 'Game mechanics and animated components for React and React Native.';
export const siteDescription =
  'Open-source spin wheels, scratch cards, slot machines, bingo, dice, coin flips, and lucky boxes. Headless TypeScript engines with accessible React and React Native renderers.';

export const githubUrl = 'https://github.com/DaniyalMalikC/jackpotkit';
export const npmUrl = 'https://www.npmjs.com/org/jackpotkit';
export const docsRoute = '/docs';

/**
 * Origin of the deployed `apps/expo-example` web export that the game pages embed as their React
 * Native preview (`/embed/<game>`). Inlined at build time from `NEXT_PUBLIC_NATIVE_PREVIEW_URL`.
 * It must stay a different origin from the docs site: the iframe sandbox allows scripts and
 * same-origin access, which is only safe when "same origin" is not the docs origin.
 */
export const nativePreviewUrl = (
  process.env.NEXT_PUBLIC_NATIVE_PREVIEW_URL || 'https://jackpotkit-native.vercel.app'
).replace(/\/+$/, '');

/** The static Open Graph image rendered by `app/og.png/route.tsx`, used by every page. */
export const ogImage = {
  alt: `${siteName}: ${siteTagline}`,
  height: 630,
  type: 'image/png',
  url: '/og.png',
  width: 1200,
} as const;
