import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

import { GameDemo } from '@/components/game-demo/lazy';
import { Playground } from '@/components/playground';

/**
 * Components available to every page in `docs/` without an import. Add new embeds here so the
 * Markdown sources stay free of app-specific import paths.
 */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    GameDemo,
    Playground,
    ...components,
  } satisfies MDXComponents;
}
