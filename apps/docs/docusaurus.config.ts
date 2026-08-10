import type { Config } from '@docusaurus/types';
import type { Options, ThemeConfig } from '@docusaurus/preset-classic';

const config: Config = {
  title: 'JackpotKit',
  tagline: 'Headless game mechanics and animated components for React Native and React.',
  favicon: 'img/favicon.svg',
  url: 'https://daniyalmalikc.github.io',
  baseUrl: '/jackpotkit/',
  organizationName: 'DaniyalMalikC',
  projectName: 'jackpotkit',
  future: {
    v4: true,
  },
  trailingSlash: false,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  presets: [
    [
      'classic',
      {
        blog: false,
        docs: {
          path: '.content',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Options,
    ],
  ],
  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'JackpotKit',
      items: [
        { label: 'Architecture', position: 'left', to: '/architecture' },
        { label: 'Roadmap', position: 'left', to: '/roadmap' },
        {
          'aria-label': 'JackpotKit GitHub repository',
          href: 'https://github.com/DaniyalMalikC/jackpotkit',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      copyright: 'Copyright © 2026 Muhammad Daniyal Malik. MIT licensed.',
      links: [
        {
          title: 'Project',
          items: [
            { label: 'Contributing', to: '/contributing' },
            { label: 'Security', to: '/security' },
            { label: 'Privacy', to: '/privacy' },
          ],
        },
      ],
      style: 'dark',
    },
  } satisfies ThemeConfig,
};

export default config;
