import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./lib/test-utils.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    env: {
      SKIP_ENV_VALIDATION: 'true',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary', 'json'],
      exclude: [
        'node_modules',
        '.next',
        'components/ui',
        '**/*.config.*',
        '**/*.d.ts',
        'lib/db/schema/**',
        'lib/db/seed.ts',
        'lib/test-utils.ts',
        'instrumentation.ts',
      ],
      thresholds: {
        lines: 95,
        branches: 95,
        functions: 95,
        statements: 95,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@template/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
