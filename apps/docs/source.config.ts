import { createShikiHighlighter } from 'fumadocs-core/highlight/shiki';
import { defaultShikiFactory } from 'fumadocs-core/highlight/shiki/full';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { remarkAutoTypeTable } from 'fumadocs-typescript';

import { getApiGenerator } from './lib/api-reference/generator';
import { remarkPlatformDifferences } from './lib/api-reference/remark-platform-differences';
import { remarkDemoteHeadings } from './lib/remark-demote-headings';
import { remarkStripTitle } from './lib/remark-strip-title';

export const docs = defineDocs({
  dir: '../../docs',
  docs: {
    schema: pageSchema,
  },
  meta: {
    schema: metaSchema,
  },
});

// The high-contrast GitHub themes keep every token at WCAG AA (4.5:1) on the tinted code-block
// background; the default github-light/dark themes do not (comments, keywords, parameters).
// Comments in the light theme (#66707b) are 3.9:1 on Fumadocs' tinted card, so they are
// darkened to #525a64 (5.4:1).
const themes = { dark: 'github-dark-high-contrast', light: 'github-light-high-contrast' } as const;
const colorReplacements = { 'github-light-high-contrast': { '#66707b': '#525a64' } };

const generator = getApiGenerator();

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: { colorReplacements, themes },
    remarkPlugins: [
      remarkStripTitle,
      remarkDemoteHeadings,
      // `<auto-type-table path="packages/..." name="..." />`: props tables generated at build
      // time from the exported types (see lib/api-reference/).
      [
        remarkAutoTypeTable,
        {
          generator,
          highlighter: createShikiHighlighter(() => defaultShikiFactory.getOrInit(), {
            colorReplacements,
            defaultColor: false,
            fallbackLanguage: 'plaintext',
            themes,
            transformers: [],
          }),
        },
      ],
      [remarkPlatformDifferences, { generator }],
    ],
  },
});
