'use client';

import { useEffect, useRef, useState } from 'react';

import { Button, Checkbox, Panel } from './ui';

export interface LogEntry {
  readonly id: number;
  readonly time: string;
  readonly name: string;
  /** JSON text of the callback arguments, or `undefined` for callbacks without arguments. */
  readonly payload: string | undefined;
}

/** Callbacks that repeat information the named callbacks already log. Hidden unless requested. */
const VERBOSE = new Set(['onEvent']);
const ANNOUNCE_INTERVAL_MS = 2000;

/**
 * The callback log. Every entry is kept; `onEvent` is hidden by default because it repeats the
 * named callbacks. Screen readers hear a short summary at most every two seconds instead of every
 * entry.
 */
export function EventLog({
  entries,
  onClear,
}: {
  readonly entries: readonly LogEntry[];
  readonly onClear: () => void;
}) {
  const [verbose, setVerbose] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const announcedCount = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(entries);

  useEffect(() => {
    latest.current = entries;
    if (entries.length < announcedCount.current) announcedCount.current = entries.length;
    if (entries.length === announcedCount.current || timer.current !== undefined) return;
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      const current = latest.current;
      const added = current.length - announcedCount.current;
      announcedCount.current = current.length;
      const last = current.at(-1);
      if (added > 0 && last !== undefined)
        setAnnouncement(`${added} new event${added === 1 ? '' : 's'}. Latest: ${last.name}.`);
    }, ANNOUNCE_INTERVAL_MS);
  }, [entries]);

  useEffect(
    () => () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
    },
    [],
  );

  const shown = verbose ? entries : entries.filter((entry) => !VERBOSE.has(entry.name));
  const hidden = entries.length - shown.length;

  return (
    <Panel
      actions={
        <>
          <Checkbox checked={verbose} label="Show onEvent" onChange={setVerbose} />
          <Button disabled={entries.length === 0} onClick={onClear}>
            Clear log
          </Button>
        </>
      }
      title="Event log"
    >
      <p aria-live="polite" className="sr-only" data-testid="event-log-announcer" role="status">
        {announcement}
      </p>
      {shown.length === 0 ? (
        <p className="m-0 text-sm text-fd-muted-foreground">
          {hidden > 0
            ? `${hidden} onEvent entr${hidden === 1 ? 'y' : 'ies'} hidden.`
            : 'No events yet. Play the game to see its callbacks.'}
        </p>
      ) : (
        <ol
          aria-label="Logged callbacks, newest first"
          className="m-0 flex max-h-72 list-none flex-col gap-1 overflow-y-auto p-0 font-mono text-xs"
          data-testid="event-log"
          tabIndex={0}
        >
          {[...shown].reverse().map((entry) => (
            <li
              className="rounded border bg-fd-background px-2 py-1"
              data-event={entry.name}
              key={entry.id}
            >
              <div className="flex flex-wrap gap-x-2">
                <span className="text-fd-muted-foreground">{entry.time}</span>
                <strong className="font-semibold">{entry.name}</strong>
              </div>
              {entry.payload === undefined ? null : (
                <pre className="m-0 overflow-x-auto break-all whitespace-pre-wrap text-fd-muted-foreground">
                  {entry.payload}
                </pre>
              )}
            </li>
          ))}
        </ol>
      )}
      {hidden > 0 && shown.length > 0 ? (
        <p className="m-0 mt-2 text-xs text-fd-muted-foreground">
          {hidden} onEvent entr{hidden === 1 ? 'y' : 'ies'} hidden.
        </p>
      ) : null}
    </Panel>
  );
}
