import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const config = tseslint.config(
  {
    ignores: [
      '**/.docusaurus/**',
      '**/.expo/**',
      '**/.turbo/**',
      '**/build/**',
      '**/coverage/**',
      '**/dist/**',
      '**/lib/**',
      '**/node_modules/**',
      '**/*.d.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports', prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'no-console': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}', '**/*.config.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['packages/core/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': ['error', 'document', 'navigator', 'window'],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@shopify/react-native-skia',
            '@shopify/react-native-skia/*',
            'expo',
            'expo-*',
            'react',
            'react/*',
            'react-native',
            'react-native/*',
            'react-native-gesture-handler',
            'react-native-gesture-handler/*',
            'react-native-reanimated',
            'react-native-reanimated/*',
          ],
        },
      ],
    },
  },
  {
    files: ['packages/react-native/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='runOnJS'] > ArrowFunctionExpression",
          message:
            'Pass a JavaScript-thread callback reference to runOnJS; locally defined worklet callbacks can crash the native runtime.',
        },
        {
          selector: "CallExpression[callee.name='runOnJS'] > FunctionExpression",
          message:
            'Pass a JavaScript-thread callback reference to runOnJS; locally defined worklet callbacks can crash the native runtime.',
        },
      ],
    },
  },
  prettier,
);

export default config;
