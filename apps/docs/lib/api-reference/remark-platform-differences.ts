import type { Generator } from 'fumadocs-typescript';
import type { List, ListItem, Paragraph, PhrasingContent, Root, RootContent } from 'mdast';

interface JsxAttribute {
  readonly name?: string;
  readonly type: string;
  readonly value?: unknown;
}

interface JsxFlowElement {
  readonly attributes: readonly JsxAttribute[];
  readonly name: string | null;
  readonly type: 'mdxJsxFlowElement';
}

export interface PlatformDifferences {
  readonly nativeOnly: readonly string[];
  readonly typeDiffers: readonly string[];
  readonly webOnly: readonly string[];
}

/** Members present on only one platform, and shared members whose types differ. */
export async function comparePlatforms(
  generator: Generator,
  name: string,
  web: string,
  native: string,
): Promise<PlatformDifferences> {
  const [webDoc] = await generator.generateTypeTable({ name, path: web });
  const [nativeDoc] = await generator.generateTypeTable({ name, path: native });
  if (webDoc === undefined || nativeDoc === undefined) {
    throw new Error(`${name} is missing from ${web} or ${native}.`);
  }
  const webTypes = new Map(webDoc.entries.map((entry) => [entry.name, entry.type]));
  const nativeTypes = new Map(nativeDoc.entries.map((entry) => [entry.name, entry.type]));
  const sorted = (names: Iterable<string>) => [...names].sort((a, b) => a.localeCompare(b));
  return {
    nativeOnly: sorted([...nativeTypes.keys()].filter((key) => !webTypes.has(key))),
    typeDiffers: sorted(
      [...webTypes]
        .filter(([key, type]) => nativeTypes.has(key) && nativeTypes.get(key) !== type)
        .map(([key]) => key),
    ),
    webOnly: sorted([...webTypes.keys()].filter((key) => !nativeTypes.has(key))),
  };
}

function codeList(names: readonly string[]): PhrasingContent[] {
  return names.flatMap((name, index) => [
    ...(index === 0 ? [] : [{ type: 'text', value: ', ' } as const]),
    { type: 'inlineCode', value: name } as const,
  ]);
}

function item(label: string, names: readonly string[]): ListItem {
  const paragraph: Paragraph = {
    children: [
      { children: [{ type: 'text', value: label }], type: 'strong' },
      { type: 'text', value: ': ' },
      ...codeList(names),
      { type: 'text', value: '.' },
    ],
    type: 'paragraph',
  };
  return { children: [paragraph], spread: false, type: 'listItem' };
}

export function differencesToMarkdown(differences: PlatformDifferences): RootContent {
  const items = [
    differences.webOnly.length > 0 && item('Only on React web', differences.webOnly),
    differences.nativeOnly.length > 0 && item('Only on React Native', differences.nativeOnly),
    differences.typeDiffers.length > 0 &&
      item('Same prop, platform-specific type', differences.typeDiffers),
  ].filter((value): value is ListItem => value !== false);
  if (items.length === 0) {
    return {
      children: [
        { type: 'text', value: 'Both platforms accept the same props with the same types.' },
      ],
      type: 'paragraph',
    };
  }
  const list: List = { children: items, ordered: false, spread: false, type: 'list' };
  return list;
}

function attribute(node: JsxFlowElement, key: string) {
  const value = node.attributes.find(
    (attr) => attr.type === 'mdxJsxAttribute' && attr.name === key,
  )?.value;
  if (typeof value !== 'string' || value === '') {
    throw new Error(`<platform-differences> needs a string \`${key}\` attribute.`);
  }
  return value;
}

/**
 * Replaces `<platform-differences name="SpinWheelProps" web="..." native="..." />` with a list
 * computed from the two exported types, so the stated platform differences cannot drift.
 */
export function remarkPlatformDifferences({ generator }: { readonly generator: Generator }) {
  return async (tree: Root) => {
    const pending: Promise<void>[] = [];
    const visit = (parent: { children: RootContent[] }) => {
      parent.children.forEach((child, index) => {
        const node = child as unknown as JsxFlowElement;
        if (node.type === 'mdxJsxFlowElement' && node.name === 'platform-differences') {
          pending.push(
            comparePlatforms(
              generator,
              attribute(node, 'name'),
              attribute(node, 'web'),
              attribute(node, 'native'),
            ).then((differences) => {
              parent.children[index] = differencesToMarkdown(differences);
            }),
          );
          return;
        }
        if ('children' in child && Array.isArray(child.children)) {
          visit(child as { children: RootContent[] });
        }
      });
    };
    visit(tree);
    await Promise.all(pending);
  };
}
