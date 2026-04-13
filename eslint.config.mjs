import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Root config: minimal rules for root-level files only.
// All app-specific rules live in apps/web/eslint.config.mjs.
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    ignores: [
      'node_modules/**',
      'apps/**',
      'packages/**',
      'infra/**',
      'e2e/**',
      '.turbo/**',
      'coverage/**',
    ],
  },
  {
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
);
