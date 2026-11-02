// Serves a static export the way Vercel serves it with `cleanUrls`, for the native preview E2E.
// Usage: node scripts/static-server.mjs <root> <port> [vercel.json]
// `/spin-wheel` serves `spin-wheel.html`, `/` serves `index.html`, unknown paths are a plain 404, and
// the `headers` rules of the given vercel.json (exact paths and `(.*)` wildcards) are applied.
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const [rootArg, portArg = '4174', vercelConfig] = process.argv.slice(2);
if (rootArg === undefined) throw new Error('Usage: static-server.mjs <root> <port> [vercel.json]');
const root = resolve(rootArg);
if (!existsSync(root)) throw new Error(`Static root ${root} does not exist. Run build:web first.`);

const types = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
};

const rules = (vercelConfig ? JSON.parse(readFileSync(vercelConfig, 'utf8')).headers : []) ?? [];
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toRegExp = (source) => new RegExp(`^${source.split('(.*)').map(escape).join('.*')}$`);
const matchers = rules.map((rule) => ({ headers: rule.headers, pattern: toRegExp(rule.source) }));

function resolveFile(pathname) {
  const candidate = normalize(join(root, pathname));
  if (!candidate.startsWith(root)) return undefined;
  for (const file of [candidate, `${candidate}.html`, join(candidate, 'index.html')]) {
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return undefined;
}

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  for (const { headers, pattern } of matchers) {
    if (pattern.test(pathname))
      for (const { key, value } of headers) response.setHeader(key, value);
  }
  // Like Vercel without a 404.html: unknown paths get a plain 404, not a client-routed page.
  const file = resolveFile(pathname);
  if (file === undefined) {
    response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    return;
  }
  response.writeHead(200, {
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
}).listen(Number(portArg), '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${portArg}`);
});
