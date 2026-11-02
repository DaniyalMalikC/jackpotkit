/**
 * Builds the project for StackBlitz's POST API (https://developer.stackblitz.com/platform/api/post-api).
 * The docs site only submits a form; the code runs in StackBlitz's own isolated origin, never in
 * the docs origin.
 */

export const STACKBLITZ_URL = 'https://stackblitz.com/run?file=src%2FApp.tsx';

/**
 * Published versions the sandbox installs. `stackblitz.test.ts` checks they match the workspace
 * package versions, so a release cannot leave the sandbox behind.
 */
export const sandboxVersions = {
  '@jackpotkit/core': '1.0.0',
  '@jackpotkit/react': '1.1.0',
  '@jackpotkit/theme': '1.0.0',
  '@types/react': '19.2.18',
  '@types/react-dom': '19.2.3',
  '@vitejs/plugin-react': '6.0.5',
  react: '19.2.3',
  'react-dom': '19.2.3',
  typescript: '6.0.3',
  vite: '8.2.1',
} as const;

export interface StackBlitzProject {
  readonly title: string;
  readonly description: string;
  readonly template: 'node';
  readonly files: Readonly<Record<string, string>>;
}

export function createStackBlitzProject(gameName: string, appSource: string): StackBlitzProject {
  const v = sandboxVersions;
  const packageJson = {
    name: 'jackpotkit-playground',
    private: true,
    type: 'module',
    scripts: { build: 'tsc --noEmit && vite build', dev: 'vite' },
    dependencies: {
      '@jackpotkit/core': `^${v['@jackpotkit/core']}`,
      '@jackpotkit/react': `^${v['@jackpotkit/react']}`,
      '@jackpotkit/theme': `^${v['@jackpotkit/theme']}`,
      react: `^${v.react}`,
      'react-dom': `^${v['react-dom']}`,
    },
    devDependencies: {
      '@types/react': `^${v['@types/react']}`,
      '@types/react-dom': `^${v['@types/react-dom']}`,
      '@vitejs/plugin-react': `^${v['@vitejs/plugin-react']}`,
      typescript: `^${v.typescript}`,
      vite: `^${v.vite}`,
    },
  };
  const tsconfig = {
    compilerOptions: {
      jsx: 'react-jsx',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      target: 'ES2022',
    },
    include: ['src'],
  };
  return {
    description: `${gameName} from @jackpotkit/react, exported from the JackpotKit docs playground.`,
    files: {
      'index.html': `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>JackpotKit ${gameName}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
      'package.json': `${JSON.stringify(packageJson, null, 2)}\n`,
      'src/App.tsx': appSource,
      'src/main.tsx': `import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\n\nimport App from './App';\n\nconst root = document.getElementById('root');\nif (root === null) throw new Error('Missing #root element.');\n\ncreateRoot(root).render(\n  <StrictMode>\n    <div style={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }}>\n      <App />\n    </div>\n  </StrictMode>,\n);\n`,
      'tsconfig.json': `${JSON.stringify(tsconfig, null, 2)}\n`,
      'vite.config.ts': `import react from '@vitejs/plugin-react';\nimport { defineConfig } from 'vite';\n\nexport default defineConfig({ plugins: [react()] });\n`,
    },
    template: 'node',
    title: `JackpotKit ${gameName} playground`,
  };
}

/** The form fields StackBlitz expects: `project[title]`, `project[files][path]`, ... */
export function stackBlitzFormFields(
  project: StackBlitzProject,
): readonly (readonly [string, string])[] {
  return [
    ['project[title]', project.title],
    ['project[description]', project.description],
    ['project[template]', project.template],
    ...Object.entries(project.files).map(
      ([path, contents]) => [`project[files][${path}]`, contents] as const,
    ),
  ];
}
