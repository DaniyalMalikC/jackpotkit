import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
    // `examples/testing` holds the testing recipe's samples; running them proves they pass.
    include: ['test/**/*.test.ts', 'examples/testing/**/*.test.ts'],
    // The generated-code check runs the TypeScript compiler over every game.
    testTimeout: 120_000,
  },
});
