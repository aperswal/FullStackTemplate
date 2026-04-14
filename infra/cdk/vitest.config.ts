import { defineConfig } from 'vitest/config';

// Without this config, vitest 4 picks up compiled test files in dist/
// alongside the source test files, doubling runs against stale snapshots.
// `tsc` emits to dist/ whenever a command runs without --noEmit, so dist/
// must be explicitly excluded from test discovery.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
  },
});
