import { createFromSource } from 'fumadocs-core/search/server';

import { source } from '@/lib/source';

// Built once at build time and downloaded by the browser; search needs no server or network.
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  language: 'english',
});
