'use client';

import { useState } from 'react';

export function CopyButton({ text }: { readonly text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      aria-label={copied ? 'Copied' : 'Copy command'}
      className="shrink-0 rounded-md border px-2 py-1 text-xs text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          },
          () => undefined,
        );
      }}
      type="button"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
