import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import i18nextPlugin from 'eslint-plugin-i18next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  // i18n enforcement: all user-facing strings in UI files must go through i18n
  {
    files: ['app/**/*.tsx', 'components/**/*.tsx', 'features/**/*.tsx'],
    plugins: { i18next: i18nextPlugin },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-text-only',
          ignoreAttribute: [
            'className',
            'class',
            'style',
            'href',
            'src',
            'alt',
            'type',
            'id',
            'name',
            'data-testid',
            'autoComplete',
            'htmlFor',
            'role',
            'key',
            'variant',
            'size',
            'strokeLinecap',
            'strokeLinejoin',
            'viewBox',
            'fill',
            'stroke',
            'd',
            'lang',
            'dir',
          ],
          ignoreCallee: [
            'cn',
            'clsx',
            'buttonVariants',
            'console.log',
            'console.error',
            'console.warn',
          ],
          ignoreProperty: ['className', 'style'],
        },
      ],
    },
  },
  // Exempt files that cannot or should not use i18n
  {
    files: ['app/global-error.tsx', 'app/api/**', 'components/ui/**'],
    rules: {
      'i18next/no-literal-string': 'off',
    },
  },
];

export default eslintConfig;
