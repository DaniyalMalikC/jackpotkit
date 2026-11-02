import config from '@jackpotkit/shared-config/eslint';

export default [
  ...config,
  {
    ignores: ['.next/**', '.source/**', '.codegen-check-*/**', 'next-env.d.ts'],
  },
];
