import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import type { DocEntry } from 'fumadocs-typescript';
import { describe, expect, it } from 'vitest';

import { defaultsForType } from '@/lib/api-reference/defaults';
import { sharedDescriptions, typeDescriptions } from '@/lib/api-reference/descriptions';
import { createApiGenerator } from '@/lib/api-reference/generator';
import { docsContentRoot, repoRoot } from '@/lib/api-reference/paths';
import { comparePlatforms } from '@/lib/api-reference/remark-platform-differences';
import { gameIds } from '@/lib/games';

const generator = createApiGenerator();

function listMdx(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return listMdx(path);
    return name.endsWith('.mdx') ? [path] : [];
  });
}

interface TableUse {
  readonly file: string;
  readonly name: string;
  readonly path: string;
}

const tableUses: TableUse[] = listMdx(docsContentRoot).flatMap((file) =>
  [...readFileSync(file, 'utf8').matchAll(/<auto-type-table\s+([^>]*?)\/>/g)].map((match) => {
    const attributes = match[1] ?? '';
    const path = /path="([^"]+)"/.exec(attributes)?.[1];
    const name = /name="([^"]+)"/.exec(attributes)?.[1];
    if (path === undefined || name === undefined) {
      throw new Error(`${relative(repoRoot, file)}: <auto-type-table> needs path and name.`);
    }
    return { file: relative(repoRoot, file), name, path };
  }),
);

async function entriesOf(path: string, name: string): Promise<readonly DocEntry[]> {
  const [doc] = await generator.generateTypeTable({ name, path });
  return doc?.entries ?? [];
}

const componentNames: Record<(typeof gameIds)[number], string> = {
  bingo: 'Bingo',
  'coin-flip': 'CoinFlip',
  dice: 'Dice',
  'lucky-box': 'LuckyBox',
  'scratch-card': 'ScratchCard',
  'slot-machine': 'SlotMachine',
  'spin-wheel': 'SpinWheel',
};

const sources = (game: string) => ({
  native: `packages/react-native/src/${game}/types.ts`,
  web: `packages/react/src/${game}/types.ts`,
});

describe('generated API tables', () => {
  it('finds the tables used in docs/', () => {
    expect(tableUses.length).toBeGreaterThan(30);
  });

  it.each(tableUses.map((use) => [`${use.file}: ${use.name}`, use] as const))(
    '%s generates a non-empty table with a description for every member',
    async (_label, use) => {
      const entries = await entriesOf(use.path, use.name);
      expect(entries.length).toBeGreaterThan(0);
      const undocumented = entries
        .filter((entry) => entry.description.trim() === '')
        .map((entry) => entry.name);
      // Add a sentence to lib/api-reference/descriptions.ts (or TSDoc in the source) for new members.
      expect(undocumented).toEqual([]);
    },
  );

  it.each(gameIds)('%s documents both platforms, their differences, and the ref', (game) => {
    const component = componentNames[game];
    // Prettier may wrap long MDX tags, so compare with collapsed whitespace.
    const source = readFileSync(join(docsContentRoot, `${game}.mdx`), 'utf8');
    const page = source.replace(/\s+/g, ' ');
    const { native, web } = sources(game);
    expect(page).toContain(`<auto-type-table path="${web}" name="${component}Props" />`);
    expect(page).toContain(`<auto-type-table path="${native}" name="${component}Props" />`);
    expect(page).toContain(
      `<platform-differences name="${component}Props" web="${web}" native="${native}" />`,
    );
    expect(page).toContain(`name="${component}Ref"`);
    // Props reference is generated; hand-written props tables would drift.
    expect(source).not.toMatch(/^\|\s*Prop\s*\|/m);
  });

  it.each(gameIds)('%s has the same ref methods on both platforms', async (game) => {
    const component = componentNames[game];
    const { native, web } = sources(game);
    const shape = (entries: readonly DocEntry[]) =>
      entries.map((entry) => [entry.name, entry.type, entry.required]);
    expect(shape(await entriesOf(native, `${component}Ref`))).toEqual(
      shape(await entriesOf(web, `${component}Ref`)),
    );
  });

  it.each(gameIds)('%s platform differences can be computed', async (game) => {
    const { native, web } = sources(game);
    const differences = await comparePlatforms(
      generator,
      `${componentNames[game]}Props`,
      web,
      native,
    );
    expect(differences.webOnly).toContain('className');
  });
});

describe('API descriptions and defaults', () => {
  const documentedTypes = new Map<string, string[]>();
  for (const use of tableUses) {
    documentedTypes.set(use.name, [...(documentedTypes.get(use.name) ?? []), use.path]);
  }

  async function membersOf(typeName: string) {
    const names = new Set<string>();
    for (const path of new Set(documentedTypes.get(typeName) ?? [])) {
      for (const entry of await entriesOf(path, typeName)) names.add(entry.name);
    }
    for (const game of gameIds) {
      for (const path of Object.values(sources(game))) {
        if (!typeName.startsWith(componentNames[game])) continue;
        try {
          for (const entry of await entriesOf(path, typeName)) names.add(entry.name);
        } catch {
          // The type is not declared in this file.
        }
      }
    }
    return names;
  }

  it.each(Object.keys(typeDescriptions))(
    'every %s description names a real member',
    async (typeName) => {
      const members = await membersOf(typeName);
      expect(members.size, `${typeName} is not a documented type`).toBeGreaterThan(0);
      const stale = Object.keys(typeDescriptions[typeName] ?? {}).filter(
        (key) => !members.has(key),
      );
      expect(stale).toEqual([]);
    },
  );

  it('every shared description names a member of some documented type', async () => {
    const all = new Set<string>();
    for (const typeName of documentedTypes.keys()) {
      for (const member of await membersOf(typeName)) all.add(member);
    }
    expect(Object.keys(sharedDescriptions).filter((key) => !all.has(key))).toEqual([]);
  });

  it.each(
    gameIds.flatMap((game) => Object.values(sources(game)).map((path) => [path, game] as const)),
  )('%s defaults are read from the component and name real props', async (path, game) => {
    const typeName = `${componentNames[game]}Props`;
    const defaults = defaultsForType(path, typeName);
    expect(defaults?.size ?? 0).toBeGreaterThan(0);
    const members = new Set((await entriesOf(path, typeName)).map((entry) => entry.name));
    expect([...(defaults?.keys() ?? [])].filter((key) => !members.has(key))).toEqual([]);
  });
});
