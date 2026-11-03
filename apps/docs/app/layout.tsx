import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { Provider } from '@/components/provider';
import {
  authorName,
  authorUrl,
  ogImage,
  siteDescription,
  siteName,
  siteTagline,
  siteUrl,
} from '@/lib/site';

import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName}: ${siteTagline}`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: authorName, url: authorUrl }],
  creator: authorName,
  openGraph: {
    type: 'website',
    siteName,
    title: siteName,
    description: siteDescription,
    url: '/',
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: [{ url: ogImage.url, alt: ogImage.alt }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fffeea' },
    { media: '(prefers-color-scheme: dark)', color: '#170a0e' },
  ],
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
