import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

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

export default defineConfig({
  mdxOptions: {
    // The high-contrast GitHub themes keep every token at WCAG AA (4.5:1) on the tinted code-block
    // background; the default github-light/dark themes do not (comments, keywords, parameters).
    // Comments in the light theme (#66707b) are 3.9:1 on Fumadocs' tinted card, so they are
    // darkened to #525a64 (5.4:1).
    rehypeCodeOptions: {
      colorReplacements: { 'github-light-high-contrast': { '#66707b': '#525a64' } },
      themes: { dark: 'github-dark-high-contrast', light: 'github-light-high-contrast' },
    },
    remarkPlugins: [remarkStripTitle],
  },
});
