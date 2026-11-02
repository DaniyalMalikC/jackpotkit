import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { Logo } from '@/components/logo';
import { docsRoute, githubUrl, npmUrl } from '@/lib/site';

export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl,
    links: [
      { active: 'nested-url', text: 'Documentation', url: docsRoute },
      { external: true, text: 'npm', url: npmUrl },
    ],
    nav: {
      title: <Logo />,
    },
  };
}
