import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { repoRoot } from '@/lib/api-reference/paths';

export type Bump = 'major' | 'minor' | 'patch';

export interface PendingChangeset {
  readonly id: string;
  readonly packages: readonly { readonly bump: Bump; readonly name: string }[];
  readonly summary: string;
}

/** Parses one `.changeset/*.md` file: a YAML frontmatter of `'package': bump` lines and a summary. */
export function parseChangeset(id: string, source: string): PendingChangeset {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (match === null) throw new Error(`.changeset/${id}.md has no frontmatter.`);
  const packages = (match[1] ?? '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const entry = /^\s*['"]?([^'":]+)['"]?\s*:\s*(major|minor|patch)\s*$/.exec(line);
      if (entry?.[1] === undefined || entry[2] === undefined) {
        throw new Error(`.changeset/${id}.md has an invalid release line: ${line}`);
      }
      return { bump: entry[2] as Bump, name: entry[1] };
    });
  return { id, packages, summary: (match[2] ?? '').trim() };
}

/**
 * Every pending changeset in the repository's `.changeset/` directory, sorted by file name. Only
 * called while prerendering static pages, so the reads are excluded from output file tracing.
 */
export function readPendingChangesets(directory = join(repoRoot, '.changeset')) {
  return readdirSync(/* turbopackIgnore: true */ directory)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .sort()
    .map((name) =>
      parseChangeset(
        name.slice(0, -3),
        readFileSync(/* turbopackIgnore: true */ join(directory, name), 'utf8'),
      ),
    );
}
