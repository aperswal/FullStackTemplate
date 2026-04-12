import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import i18nextPlugin from 'eslint-plugin-i18next';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      '.turbo/**',
      'coverage/**',
      'apps/web/.next/**',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'stripe',
              message: 'Import from @/lib/payments/providers/ instead of stripe directly.',
              allowTypeImports: true,
            },
            {
              name: 'resend',
              message: 'Import from @/lib/email/providers/ instead of resend directly.',
            },
            {
              name: 'nodemailer',
              message: 'Import from @/lib/email/providers/ instead of nodemailer directly.',
            },
            {
              name: 'posthog-js',
              message: 'Import from @/lib/analytics/ instead of posthog-js directly.',
            },
          ],
        },
      ],
    },
  },
  // Provider implementation files are allowed to import their respective libraries
  {
    files: ['apps/web/lib/payments/providers/**', 'apps/web/lib/payments/stripe.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['apps/web/lib/email/providers/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['apps/web/lib/analytics/posthog.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // i18n enforcement: all user-facing strings in UI files must go through i18n
  {
    files: ['apps/web/app/**/*.tsx', 'apps/web/components/**/*.tsx', 'apps/web/features/**/*.tsx'],
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
    files: [
      'apps/web/app/global-error.tsx',
      'apps/web/app/api/**',
      'apps/web/lib/**',
      'packages/**',
    ],
    rules: {
      'i18next/no-literal-string': 'off',
    },
  },
);
