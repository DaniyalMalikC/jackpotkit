import { Markdown } from 'fumadocs-core/content/md';

import { type Bump, readPendingChangesets } from '@/lib/changesets';

const bumpLabel: Record<Bump, string> = { major: 'Major', minor: 'Minor', patch: 'Patch' };

/**
 * Lists the pending `.changeset/*.md` entries at build time, grouped by package, so the
 * "Unreleased" section of the migration guide always matches what the next version PR will
 * release. Renders a short note when nothing is pending.
 */
export function UnreleasedChanges() {
  const changesets = readPendingChangesets();
  if (changesets.length === 0) return <p>No unreleased changes are pending.</p>;
  const byPackage = new Map<string, { bump: Bump; id: string; summary: string }[]>();
  for (const changeset of changesets) {
    for (const { bump, name } of changeset.packages) {
      byPackage.set(name, [
        ...(byPackage.get(name) ?? []),
        { bump, id: changeset.id, summary: changeset.summary },
      ]);
    }
  }
  return (
    <>
      {[...byPackage.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, entries]) => (
          <section key={name} aria-label={`Unreleased changes in ${name}`}>
            <p>
              <strong>
                <code>{name}</code>
              </strong>
            </p>
            <ul>
              {entries.map((entry) => (
                <li key={entry.id}>
                  <Markdown>{`**${bumpLabel[entry.bump]}:** ${entry.summary}`}</Markdown>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </>
  );
}
