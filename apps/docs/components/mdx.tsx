import { TypeTable } from 'fumadocs-ui/components/type-table';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

import { GameDemo } from '@/components/game-demo/lazy';
import { NativePreview } from '@/components/native-preview/native-preview';
import { Playground } from '@/components/playground';

/**
 * Components available to every page in `docs/` without an import. Add new embeds here so the
 * Markdown sources stay free of app-specific import paths.
 */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    GameDemo,
    NativePreview,
    Playground,
    // Output of `<auto-type-table>` (generated at build time by fumadocs-typescript).
    TypeTable,
    ...components,
  } satisfies MDXComponents;
}
