import js from '@eslint/js';
import tseslint from 'typescript-eslint';

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
    files: [
      'apps/web/lib/payments/providers/**',
      'apps/web/lib/payments/stripe.ts',
    ],
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
);
