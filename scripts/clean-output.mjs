import { rmSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const allowedNames = new Set([
  '.docusaurus',
  '.expo',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'lib',
]);

for (const target of process.argv.slice(2)) {
  const resolvedTarget = resolve(process.cwd(), target);
  const targetName = basename(resolvedTarget);

  if (!allowedNames.has(targetName)) {
    throw new Error(`Refusing to clean unexpected output directory: ${target}`);
  }

  rmSync(resolvedTarget, { force: true, recursive: true });
}
