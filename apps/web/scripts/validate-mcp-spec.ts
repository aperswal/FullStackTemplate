/**
 * Build-time validation: ensures all API routes and page routes
 * are registered in the MCP spec (lib/mcp/spec.ts).
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
  // Remove the filename
  rel = rel.replace(/\/route\.tsx?$/, '').replace(/\/page\.tsx$/, '');
  // Remove route groups like (marketing), (app), (auth)
  rel = rel.replace(/\([\w-]+\)\/?/g, '');
  // Clean up
  rel = `/${rel.replace(/\/$/, '')}`;
  if (rel === '/') {
    return '/';
  }
  return rel;
}

const errors: string[] = [];

// Check API routes (both .ts and .tsx extensions)
const apiRoutes = [
  ...findFiles(join(APP_DIR, 'api'), 'route.ts'),
  ...findFiles(join(APP_DIR, 'api'), 'route.tsx'),
];
const specPaths = new Set(spec.endpoints.map((e) => e.path));

for (const routeFile of apiRoutes) {
  const routePath = routeFileToPath(routeFile, APP_DIR);
  // BetterAuth catch-all is dynamic, skip it
  if (routePath.includes('[...all]') || routePath.includes('[')) {
    continue;
  }

  if (!specPaths.has(routePath)) {
    const rel = relative(join(APP_DIR, '..'), routeFile);
    errors.push(
      `API route ${routePath} (${rel}) has no entry in lib/mcp/spec.ts\n` +
        `  → Add an endpoint definition for path '${routePath}'\n` +
        `  → Template: { path: '${routePath}', method: 'GET', auth: true, description: '...' }`,
    );
  }
}

// Check page routes
const pageFiles = findFiles(APP_DIR, 'page.tsx');
const specRoutes = new Set(spec.routes.map((r) => r.path));

for (const pageFile of pageFiles) {
  const pagePath = routeFileToPath(pageFile, APP_DIR);
  // Skip API pages (they don't have page.tsx but just in case)
  if (pagePath.startsWith('/api')) {
    continue;
  }

  if (!specRoutes.has(pagePath)) {
    const rel = relative(join(APP_DIR, '..'), pageFile);
    errors.push(
      `Page route ${pagePath} (${rel}) has no entry in lib/mcp/spec.ts routes\n` +
        `  → Add a route definition for path '${pagePath}'\n` +
        `  → Template: { path: '${pagePath}', title: '...', description: '...' }`,
    );
  }
}

// Reverse validation: spec entries must point to actual route files
const apiPathsOnDisk = new Set(apiRoutes.map((f) => routeFileToPath(f, APP_DIR)));
const pagePathsOnDisk = new Set(
  pageFiles.map((f) => routeFileToPath(f, APP_DIR)).filter((p) => !p.startsWith('/api')),
);

// BetterAuth catch-all handles all /api/auth/* sub-routes
const catchAllPrefixes = ['/api/auth/'];

for (const endpoint of spec.endpoints) {
  // Dynamic/catch-all routes won't have exact matches on disk
  if (endpoint.path.includes('[')) {
    continue;
  }
  // Routes served by a catch-all handler don't have individual files
  if (catchAllPrefixes.some((prefix) => endpoint.path.startsWith(prefix))) {
    continue;
  }
  if (!apiPathsOnDisk.has(endpoint.path)) {
    errors.push(
      `Spec endpoint ${endpoint.path} has no matching route file on disk\n` +
        `  → Either create app${endpoint.path}/route.ts or remove it from spec.ts`,
    );
  }
  if (endpoint.description === '') {
    errors.push(`Spec endpoint ${endpoint.path} has an empty description`);
  }
}

for (const route of spec.routes) {
  if (!pagePathsOnDisk.has(route.path)) {
    errors.push(
      `Spec route ${route.path} has no matching page file on disk\n` +
        `  → Either create the page or remove it from spec.ts`,
    );
  }
  if (route.description === '') {
    errors.push(`Spec route ${route.path} has an empty description`);
  }
}

if (errors.length > 0) {
  console.error('\n✗ MCP spec validation failed:\n');
  for (const err of errors) {
    console.error(`  ${err}\n`);
  }
  console.error(`${errors.length} issue(s) found in lib/mcp/spec.ts`);
  console.error(
    'All API routes and pages must be registered in the MCP spec, and all spec entries must correspond to actual routes.',
  );
  process.exit(1);
} else {
  console.log('✓ MCP spec validation passed — all routes registered, all spec entries valid');
}
