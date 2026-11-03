import { describe, expect, it } from 'vitest';

import { parseChangeset, readPendingChangesets } from '@/lib/changesets';

describe('pending changesets for the migration guide', () => {
  it('parses package bumps and the summary', () => {
    expect(
      parseChangeset(
        'demo',
        '---\n\'@jackpotkit/react\': patch\n"@jackpotkit/core": minor\n---\n\nFix it.\n',
      ),
    ).toEqual({
      id: 'demo',
      packages: [
        { bump: 'patch', name: '@jackpotkit/react' },
        { bump: 'minor', name: '@jackpotkit/core' },
      ],
      summary: 'Fix it.',
    });
  });

  it('rejects a file without frontmatter or with an unknown bump', () => {
    expect(() => parseChangeset('bad', 'No frontmatter')).toThrow(/frontmatter/);
    expect(() => parseChangeset('bad', "---\n'@jackpotkit/react': huge\n---\nx")).toThrow(
      /release line/,
    );
  });

  it('reads every changeset in the repository', () => {
    for (const changeset of readPendingChangesets()) {
      expect(changeset.packages.length).toBeGreaterThan(0);
      expect(changeset.summary).not.toBe('');
    }
  });
});
