import { createRelativeLink } from 'fumadocs-ui/mdx';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
} from 'fumadocs-ui/layouts/docs/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getMDXComponents } from '@/components/mdx';
import { SiteCredit } from '@/components/site-credit';
import { githubUrl, ogImage } from '@/lib/site';
import { source } from '@/lib/source';

interface DocsRouteProps {
  readonly params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: DocsRouteProps) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // Resolves relative Markdown links such as `./spin-wheel.mdx` to site routes.
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      <EditOnGitHub href={`${githubUrl}/blob/main/docs/${page.path}`} />
      <SiteCredit className="border-t pt-4 text-sm text-fd-muted-foreground" />
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: DocsRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
    openGraph: {
      type: 'article',
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      // Page-level `openGraph` replaces the root one, so the shared image is repeated here.
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
      images: [{ url: ogImage.url, alt: ogImage.alt }],
    },
  };
}
