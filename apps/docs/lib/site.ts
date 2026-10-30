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
