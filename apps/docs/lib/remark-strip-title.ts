import type { Root } from 'mdast';

/**
 * Removes the leading `# Heading` from a page. The docs layout renders the frontmatter `title`,
 * while the source Markdown keeps its H1 so it still reads well on GitHub.
 */
export function remarkStripTitle() {
  return (tree: Root) => {
    const index = tree.children.findIndex((node) => node.type === 'heading' && node.depth === 1);
    if (index !== -1) tree.children.splice(index, 1);
  };
}
