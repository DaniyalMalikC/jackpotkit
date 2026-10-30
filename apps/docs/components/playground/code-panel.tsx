'use client';

import { useMemo, useState } from 'react';

import {
  createStackBlitzProject,
  STACKBLITZ_URL,
  stackBlitzFormFields,
} from '@/lib/playground/stackblitz';

import { Button, Panel } from './ui';

export function CodePanel({
  code,
  gameName,
}: {
  readonly code: string;
  readonly gameName: string;
}) {
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  const fields = useMemo(
    () => stackBlitzFormFields(createStackBlitzProject(gameName, code)),
    [code, gameName],
  );

  return (
    <Panel
      actions={
        <>
          <Button
            onClick={() => {
              const done = (result: 'copied' | 'failed') => {
                setCopied(result);
                window.setTimeout(() => setCopied('idle'), 1500);
              };
              if (navigator.clipboard === undefined) {
                done('failed');
                return;
              }
              void navigator.clipboard.writeText(code).then(
                () => done('copied'),
                () => done('failed'),
              );
            }}
          >
            {copied === 'copied' ? 'Copied' : copied === 'failed' ? 'Copy failed' : 'Copy code'}
          </Button>
          {/* StackBlitz's POST API: the code runs in StackBlitz's origin, not on this site. */}
          <form action={STACKBLITZ_URL} method="post" rel="noopener noreferrer" target="_blank">
            {fields.map(([name, value]) => (
              <input key={name} name={name} type="hidden" value={value} />
            ))}
            <Button type="submit">
              Open in StackBlitz<span className="sr-only"> (opens in a new tab)</span>
            </Button>
          </form>
        </>
      }
      title="Code"
    >
      <p className="m-0 mb-2 text-xs text-fd-muted-foreground">
        Reflects the current controls. Only props that differ from the component defaults are
        included.
      </p>
      <div
        aria-label="Generated code"
        className="max-h-96 overflow-auto rounded-md border bg-fd-secondary"
        role="region"
        tabIndex={0}
      >
        <pre
          className="m-0 p-3 font-mono text-xs leading-relaxed text-fd-secondary-foreground"
          data-testid="playground-code"
        >
          <code>{code}</code>
        </pre>
      </div>
    </Panel>
  );
}
