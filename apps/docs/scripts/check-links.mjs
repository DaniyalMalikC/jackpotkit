// Fails when a relative Markdown link in root `docs/` (or a README/CONTRIBUTING link into
// `docs/`) points at a file or heading that does not exist. Keeping links as relative `.md`/`.mdx`
// paths means they work on GitHub and are resolved to site routes by Fumadocs.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../../..');
const docsRoot = join(repoRoot, 'docs');
const contentExtensions = new Set(['.md', '.mdx']);

function listContent(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return listContent(path);
    return contentExtensions.has(extname(name)) ? [path] : [];
  });
}

// Mirrors github-slugger, which both GitHub and Fumadocs use for heading anchors.
function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

function stripCode(markdown) {
  return markdown.replace(/^(```|~~~)[\s\S]*?^\1/gm, '').replace(/`[^`\n]*`/g, '');
}

const anchorCache = new Map();
function anchorsFor(file) {
  if (!anchorCache.has(file)) {
    const counts = new Map();
    const anchors = new Set();
    for (const match of stripCode(readFileSync(file, 'utf8')).matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
      const plain = match[1].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_]/g, '');
      const base = slugify(plain);
      const count = counts.get(base) ?? 0;
      counts.set(base, count + 1);
      anchors.add(count === 0 ? base : `${base}-${count}`);
    }
    anchorCache.set(file, anchors);
  }
  return anchorCache.get(file);
}

function checkFile(file, { requireDocsTarget }) {
  const problems = [];
  const source = stripCode(readFileSync(file, 'utf8'));
  for (const match of source.matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    const target = match[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) continue;
    if (target.startsWith('/')) {
      problems.push(`${target}: use a relative file link so it also works on GitHub`);
      continue;
    }

    const [pathPart, hash] = target.split('#');
    const resolved = pathPart ? resolve(dirname(file), decodeURIComponent(pathPart)) : file;
    const insideDocs = !relative(docsRoot, resolved).startsWith('..');
    if (requireDocsTarget && !insideDocs) continue;

    if (!existsSync(resolved)) {
      problems.push(`${target}: file not found`);
      continue;
    }
    if (
      insideDocs &&
      pathPart &&
      statSync(resolved).isFile() &&
      !contentExtensions.has(extname(resolved))
    ) {
      problems.push(`${target}: links inside docs/ must point at a .md or .mdx page`);
      continue;
    }
    if (hash && contentExtensions.has(extname(resolved)) && !anchorsFor(resolved).has(hash)) {
      problems.push(`${target}: heading anchor #${hash} not found`);
    }
  }
  return problems;
}

const targets = [
  ...listContent(docsRoot).map((file) => ({ file, requireDocsTarget: false })),
  ...['README.md', 'CONTRIBUTING.md']
    .map((name) => join(repoRoot, name))
    .filter((file) => existsSync(file))
    .map((file) => ({ file, requireDocsTarget: true })),
];

let failures = 0;
for (const { file, requireDocsTarget } of targets) {
  for (const problem of checkFile(file, { requireDocsTarget })) {
    failures += 1;
    console.error(`${relative(repoRoot, file)}: ${problem}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} broken documentation link(s).`);
  process.exit(1);
}
console.log(`Checked links in ${targets.length} files: no broken internal links.`);
