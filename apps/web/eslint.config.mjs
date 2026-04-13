import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import i18nextPlugin from 'eslint-plugin-i18next';
// jsx-a11y plugin is already registered by next/core-web-vitals — only rules added below

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'coverage/**',
      'eslint.config.mjs',
      'postcss.config.mjs',
      'scripts/migrate.cjs',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  // ─── TypeScript-specific rules ──────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',

      // Naming conventions (Clean Code ch.2, Code Complete ch.11)
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        { selector: 'property', modifiers: ['requiresQuotes'], format: null },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE', 'PascalCase'] },
        { selector: 'import', format: null },
      ],

      // Function discipline (Code Complete ch.7, Clean Code ch.3)
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', { max: 4 }],
      'max-params': ['error', { max: 4 }],
      'max-nested-callbacks': ['error', { max: 3 }],

      // Exhaustive branching (Clean Code ch.7 — handle every case)
      'default-case': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],

      // No implicit behavior / defensive programming (Pragmatic Programmer ch.4)
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: true,
          allowNullableBoolean: true,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],
      'no-implicit-coercion': 'error',
      'no-param-reassign': 'error',
      '@typescript-eslint/no-shadow': 'error',
      'guard-for-in': 'error',

      // No magic values (Code Complete ch.12)
      'no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
        },
      ],

      // Return type safety (Clean Code ch.3)
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'consistent-return': 'error',

      // Type safety — ban @ts-ignore, restrict type assertions
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Prefer safe operators
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // No silent error swallowing
      'no-empty': ['error', { allowEmptyCatch: false }],

      // File discipline — keep files focused
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  // ─── Code quality (Pragmatic Programmer, Clean Code) ────────────────────
  {
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'no-nested-ternary': 'error',
      'prefer-template': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-unneeded-ternary': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false }],
      'no-lonely-if': 'error',
      'no-useless-return': 'error',
      curly: ['error', 'all'],

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
  // ─── Provider files: exempt from import restrictions ────────────────────
  {
    files: ['lib/payments/providers/**', 'lib/payments/stripe.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['lib/email/providers/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['lib/analytics/posthog.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  // ─── i18n: all user-facing strings must go through next-intl ────────────
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
  // Exempt from i18n
  {
    files: ['app/global-error.tsx', 'app/api/**', 'components/ui/**', 'lib/**'],
    rules: { 'i18next/no-literal-string': 'off' },
  },
  // ─── Accessibility: enforce alt text, aria, semantic roles ──────────────
  // jsx-a11y plugin is provided by next/core-web-vitals — promote rules to error
  {
    files: ['**/*.tsx'],
    ignores: ['**/*.test.tsx', 'app/api/**'],
    rules: {
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
    },
  },
  // ─── Console: block ALL methods — use structured logger ─────────────────
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [
      '**/*.test.{ts,tsx}',
      'lib/db/seed.ts',
      'lib/env.ts',
      'scripts/**',
      'app/**/error.tsx',
      'app/global-error.tsx',
    ],
    rules: {
      'no-console': 'error',
    },
  },
  // ─── Test files: relax rules for test ergonomics ────────────────────────
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      complexity: 'off',
      'max-depth': 'off',
      'max-nested-callbacks': 'off',
      'max-params': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'no-magic-numbers': 'off',
      'no-param-reassign': 'off',
      'no-empty': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'consistent-return': 'off',
    },
  },
  // ─── Config/script files: relax naming ──────────────────────────────────
  {
    files: ['**/*.config.{ts,mjs,js}', 'scripts/**', 'lib/env.ts', 'lib/db/seed.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'no-magic-numbers': 'off',
      'consistent-return': 'off',
    },
  },
  // ─── Schema files: relax naming (Drizzle columns use snake_case) ───────
  {
    files: ['lib/db/schema/**'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      'no-magic-numbers': 'off',
    },
  },
  // ─── Migration files: auto-generated, relax everything ─────────────────
  {
    files: ['lib/db/migrations/**'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
    },
  },
  // ─── shadcn/ui components: generated code, relax strict rules ───────────
  {
    files: ['components/ui/**'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'no-magic-numbers': 'off',
      'no-empty': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
    },
  },
  // ─── External API interfaces: relax naming (third-party APIs use snake_case) ─
  {
    files: [
      'app/manifest.ts',
      'lib/analytics/posthog.ts',
      'lib/db/index.ts',
      'lib/payments/checkout.ts',
      'lib/seo/json-ld.tsx',
    ],
    rules: { '@typescript-eslint/naming-convention': 'off' },
  },
  // ─── SDK interop files: type assertions needed for SDK boundaries ──────
  {
    files: ['app/api/mcp/**', 'lib/mcp/**'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  // ─── Ban direct process.env — use validated env module ──────────────────
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [
      'lib/env.ts',
      'instrumentation.ts',
      'next.config.ts',
      'drizzle.config.ts',
      'middleware.ts',
      'lib/db/seed.ts',
      'scripts/**',
      '**/*.test.{ts,tsx}',
      'vitest.config.ts',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[object.object.name="process"][object.property.name="env"]',
          message:
            'Use `import { env } from "@/lib/env"` instead of process.env. All environment variables must be validated through lib/env.ts.',
        },
      ],
    },
  },
  // ─── Ban plain Error() — force typed errors ────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', 'lib/db/seed.ts', 'scripts/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Error']",
          message:
            'Use ClientError, ServerError, or ExternalServiceError instead of plain Error. Import from @/lib/errors.',
        },
        {
          selector: "ThrowStatement > NewExpression[callee.name='Error']",
          message:
            'Use ClientError, ServerError, or ExternalServiceError instead of throw new Error(). Import from @/lib/errors.',
        },
      ],
    },
  },
  // ─── API routes must use withApiRoute() wrapper ────────────────────────
  {
    files: ['app/api/**/route.{ts,tsx}'],
    ignores: ['app/api/auth/**', 'app/api/og/**', 'app/api/webhooks/**', 'app/api/mcp/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[object.object.name="process"][object.property.name="env"]',
          message: 'Use `import { env } from "@/lib/env"` instead of process.env.',
        },
        {
          selector: "NewExpression[callee.name='Error']",
          message: 'Use ClientError, ServerError, or ExternalServiceError instead of plain Error.',
        },
        {
          selector: 'ExportNamedDeclaration > FunctionDeclaration',
          message:
            'API route handlers must use withApiRoute(). Export: const GET = withApiRoute(..., handler)',
        },
      ],
    },
  },
);
