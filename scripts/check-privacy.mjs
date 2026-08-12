import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const publishedSourceRoots = ['core', 'react-native', 'react', 'theme', 'testing'].map(
  (directory) => join(repositoryRoot, 'packages', directory, 'src'),
);
const forbiddenNetworkPatterns = [
  [/(?:^|[^.\w])fetch\s*\(/, 'fetch'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bnavigator\.sendBeacon\b/, 'navigator.sendBeacon'],
  [/\bnew\s+WebSocket\b/, 'WebSocket'],
];
const forbiddenTelemetryImports = [
  '@amplitude',
  '@segment',
  '@sentry',
  'firebase/analytics',
  'mixpanel',
  'posthog',
];

function collect(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collect(path);
    if (
      !['.ts', '.tsx'].includes(extname(entry.name)) ||
      /\.(?:test|spec)\.[^.]+$/.test(entry.name)
    ) {
      return [];
    }
    return [path];
  });
}

for (const file of publishedSourceRoots.flatMap(collect)) {
  const source = readFileSync(file, 'utf8');
  const displayPath = relative(repositoryRoot, file);
  for (const [pattern, name] of forbiddenNetworkPatterns) {
    if (pattern.test(source))
      throw new Error(`${displayPath} contains prohibited outbound API ${name}.`);
  }
  for (const moduleName of forbiddenTelemetryImports) {
    if (source.includes(moduleName)) {
      throw new Error(`${displayPath} references prohibited telemetry dependency ${moduleName}.`);
    }
  }
}

console.log('Published package source contains no built-in telemetry or outbound network calls.');
