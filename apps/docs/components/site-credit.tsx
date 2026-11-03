import { authorName, authorUrl } from '@/lib/site';

/** Author credit shown in the homepage footer and at the end of every docs page. */
export function SiteCredit({ className }: { readonly className?: string }) {
  return (
    <p className={className}>
      Created and maintained by{' '}
      <a
        className="font-medium text-fd-foreground underline underline-offset-4"
        href={authorUrl}
        rel="author noreferrer"
      >
        {authorName}
      </a>{' '}
      · © 2026 · MIT licensed
    </p>
  );
}
