'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';

import StaticSearchDialog from '@/components/search';

export function Provider({ children }: { readonly children: ReactNode }) {
  return <RootProvider search={{ SearchDialog: StaticSearchDialog }}>{children}</RootProvider>;
}
