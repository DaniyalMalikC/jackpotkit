import type { Root } from 'mdast';

/**
 * On pages whose frontmatter sets `demoteHeadings: true`, moves every heading one level down.
 * The changelog page includes the package `CHANGELOG.md` files, whose `# @jackpotkit/<name>`
 * titles then become the page's sections. Runs after `remarkStripTitle`, so the page title is
 * already removed.
 */
export function remarkDemoteHeadings() {
  return (tree: Root, file: { data: Record<string, unknown> }) => {
    const frontmatter = file.data.frontmatter as { demoteHeadings?: unknown } | undefined;
    if (frontmatter?.demoteHeadings !== true) return;
    const visit = (node: { children?: unknown[]; depth?: number; type: string }) => {
      if (node.type === 'heading' && node.depth !== undefined) {
        node.depth = Math.min(6, node.depth + 1);
      }
      for (const child of node.children ?? []) visit(child as typeof node);
    };
    visit(tree);
  };
}
