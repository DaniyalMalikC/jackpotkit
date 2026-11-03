import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * The repository root, found by walking up from the working directory to `pnpm-workspace.yaml`.
 * `source.config.ts` is bundled into `.source/` before it runs, so `import.meta` paths are not
 * stable there; every entry point (fumadocs-mdx, `next build`, vitest) runs inside the repository.
 */
export function findRepoRoot(from: string = process.cwd()): string {
  let current = resolve(from);
  for (;;) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) return current;
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`Could not find the repository root (pnpm-workspace.yaml) above ${from}.`);
    }
    current = parent;
  }
}

export const repoRoot = findRepoRoot();
export const docsAppRoot = join(repoRoot, 'apps', 'docs');
export const docsContentRoot = join(repoRoot, 'docs');

export type ApiPlatform = 'core' | 'native' | 'testing' | 'theme' | 'web';

/** The package a repository-relative source path belongs to. */
export function platformOf(path: string): ApiPlatform {
  const normalized = path.replaceAll('\\', '/').replace(/^\.\//, '');
  if (normalized.startsWith('packages/react-native/')) return 'native';
  if (normalized.startsWith('packages/react/')) return 'web';
  if (normalized.startsWith('packages/theme/')) return 'theme';
  if (normalized.startsWith('packages/testing/')) return 'testing';
  if (normalized.startsWith('packages/core/')) return 'core';
  throw new Error(`${path} is not inside a published package's src directory.`);
}
