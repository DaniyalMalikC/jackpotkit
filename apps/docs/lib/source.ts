import { loader } from 'fumadocs-core/source';

import { docs } from '@/.source/server';
import { docsRoute } from '@/lib/site';

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
});
