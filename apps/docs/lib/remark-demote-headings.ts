import type { Root } from 'mdast';

/**
 * Pages whose headings all move one level down. The changelog page includes the package
 * `CHANGELOG.md` files, whose `# @jackpotkit/<name>` titles then become the page's sections.
 * Runs after `remarkStripTitle`, so the page's own title is already removed.
 */
const demotedPages = ['docs/changelog.mdx'];

export function remarkDemoteHeadings() {
  return (tree: Root, file: { path?: string }) => {
    const path = (file.path ?? '').replaceAll('\\', '/');
    if (!demotedPages.some((page) => path.endsWith(`/${page}`))) return;
    const visit = (node: { children?: unknown[]; depth?: number; type: string }) => {
      if (node.type === 'heading' && node.depth !== undefined) {
        node.depth = Math.min(6, node.depth + 1);
      }
      for (const child of node.children ?? []) visit(child as typeof node);
    };
    visit(tree);
  };
}
