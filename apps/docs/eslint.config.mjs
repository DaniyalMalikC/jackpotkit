import config from '@jackpotkit/shared-config/eslint';

export default [
  ...config,
  {
    ignores: ['.next/**', '.source/**', 'next-env.d.ts'],
  },
];
