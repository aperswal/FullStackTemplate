/**
 * Build-time validation: ensures every entry in the user-facing MCP spec
 * (lib/mcp/spec.ts) maps to a real page or API route on disk.
 *
 * Note: the spec is intentionally a curated subset of the app. It does not
 * need to list every route - only the user-facing pages and actions the
 * MCP server exposes. We only validate the reverse direction here.
 *
 * Run: pnpm --filter @template/web validate:mcp
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

import { spec } from '../lib/mcp/spec';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, '..', 'app');

function findFiles(dir: string, filename: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) {
    return results;
  }

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findFiles(full, filename));
    } else if (entry === filename) {
      results.push(full);
    }
  }
  return results;
}

function routeFileToPath(filePath: string, base: string): string {
  let rel = relative(base, filePath);
  rel = rel.replace(/\/route\.tsx?$/, '').replace(/\/page\.tsx$/, '');
  rel = rel.replace(/\([\w-]+\)\/?/g, '');
  rel = `/${rel.replace(/\/$/, '')}`;
  if (rel === '/') {
    return '/';
  }
  return rel;
}

const apiRoutes = [
  ...findFiles(join(APP_DIR, 'api'), 'route.ts'),
  ...findFiles(join(APP_DIR, 'api'), 'route.tsx'),
];
const apiPathsOnDisk = new Set(apiRoutes.map((f) => routeFileToPath(f, APP_DIR)));

const pageFiles = findFiles(APP_DIR, 'page.tsx');
const pagePathsOnDisk = new Set(
  pageFiles.map((f) => routeFileToPath(f, APP_DIR)).filter((p) => !p.startsWith('/api')),
);

// BetterAuth catch-all handles all /api/auth/* sub-routes
const catchAllPrefixes = ['/api/auth/'];

const errors: string[] = [];

for (const action of spec.actions) {
  if (action.description === '') {
    errors.push(`Spec action '${action.name}' has an empty description`);
  }
  if (catchAllPrefixes.some((prefix) => action.path.startsWith(prefix))) {
    continue;
  }
  if (action.path.includes('[')) {
    continue;
  }
  if (!apiPathsOnDisk.has(action.path)) {
    errors.push(
      `Spec action '${action.name}' targets ${action.path}, which has no matching route file on disk\n` +
        `  -> Either create app${action.path}/route.ts or remove the action from spec.ts`,
    );
  }
}

for (const page of spec.pages) {
  if (page.description === '') {
    errors.push(`Spec page ${page.path} has an empty description`);
  }
  if (page.title === '') {
    errors.push(`Spec page ${page.path} has an empty title`);
  }
  if (!pagePathsOnDisk.has(page.path)) {
    errors.push(
      `Spec page ${page.path} has no matching page.tsx file on disk\n` +
        `  -> Either create the page or remove it from spec.ts`,
    );
  }
}

if (errors.length > 0) {
  console.error('\n[FAIL] MCP spec validation failed:\n');
  for (const err of errors) {
    console.error(`  ${err}\n`);
  }
  console.error(`${errors.length} issue(s) found in lib/mcp/spec.ts`);
  process.exit(1);
} else {
  console.log('[OK] MCP spec validation passed - every spec entry points to a real route');
}
