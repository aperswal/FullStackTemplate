import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Recursively find all files matching a filename pattern under a directory.
 * Skips node_modules and .next directories.
 */
function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') {
        continue;
      }
      results.push(...findFiles(fullPath, pattern));
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

function toRelative(filePath: string): string {
  return path.relative(PROJECT_ROOT, filePath);
}

/**
 * Returns true if the file path matches any of the given directory prefixes
 * (relative to the project root).
 */
function matchesExemption(filePath: string, exemptions: string[]): boolean {
  const relative = toRelative(filePath);
  return exemptions.some((exemption) => relative.startsWith(exemption));
}

describe('Architectural enforcement', () => {
  describe('All API routes use withApiRoute', () => {
    const API_ROUTE_EXEMPTIONS: Record<string, string> = {
      'app/api/auth/': 'BetterAuth delegated handler',
      'app/api/og/': 'Edge Runtime incompatible with withApiRoute',
      'app/api/webhooks/': 'Custom signature verification required',
      'app/api/mcp/': 'Custom MCP protocol handling',
    };

    const routeFiles = findFiles(path.join(PROJECT_ROOT, 'app', 'api'), /^route\.(ts|tsx)$/);

    it('finds at least one API route file', () => {
      expect(routeFiles.length).toBeGreaterThan(0);
    });

    const nonExemptRoutes = routeFiles.filter(
      (file) => !matchesExemption(file, Object.keys(API_ROUTE_EXEMPTIONS)),
    );

    for (const routeFile of nonExemptRoutes) {
      const relative = toRelative(routeFile);

      it(`${relative} imports and uses withApiRoute`, () => {
        const content = readFile(routeFile);
        expect(
          content.includes('withApiRoute'),
          `${relative} must import and use withApiRoute. ` +
            'If this route needs an exemption, add it to API_ROUTE_EXEMPTIONS with a reason.',
        ).toBe(true);
      });
    }

    it('all exempted routes actually exist', () => {
      for (const exemption of Object.keys(API_ROUTE_EXEMPTIONS)) {
        const exemptDir = path.join(PROJECT_ROOT, exemption);
        const dirExists = fs.existsSync(exemptDir);
        const reason = API_ROUTE_EXEMPTIONS[exemption];
        expect(
          dirExists,
          `Exemption "${exemption}" (${reason}) points to a directory that does not exist. Remove stale exemption.`,
        ).toBe(true);
      }
    });
  });

  describe('All server action files use withServerAction', () => {
    const SERVER_ACTION_EXEMPTIONS: Record<string, string> = {
      'lib/payments/checkout.ts':
        'Uses redirect() which is incompatible with withServerAction return type',
    };

    const allTsFiles = findFiles(PROJECT_ROOT, /\.(ts|tsx)$/);

    const serverActionFiles = allTsFiles.filter((file) => {
      if (file.includes('node_modules') || file.includes('.next')) {
        return false;
      }
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
        return false;
      }
      const content = readFile(file);
      return content.startsWith("'use server'") || content.startsWith('"use server"');
    });

    it('finds at least one server action file', () => {
      expect(serverActionFiles.length).toBeGreaterThan(0);
    });

    const nonExemptActions = serverActionFiles.filter(
      (file) => !SERVER_ACTION_EXEMPTIONS[toRelative(file)],
    );

    for (const actionFile of nonExemptActions) {
      const relative = toRelative(actionFile);

      it(`${relative} uses withServerAction for exported functions`, () => {
        const content = readFile(actionFile);

        const exportedFunctionPattern =
          /export\s+(?:async\s+)?function\s+\w+|export\s+const\s+\w+\s*=/g;
        const exports = content.match(exportedFunctionPattern) ?? [];

        if (exports.length === 0) {
          return;
        }

        expect(
          content.includes('withServerAction'),
          `${relative} has exported functions but does not use withServerAction. ` +
            'Wrap server actions with withServerAction for consistent auth, logging, and error handling. ' +
            'If this file needs an exemption, add it to SERVER_ACTION_EXEMPTIONS with a reason.',
        ).toBe(true);
      });
    }
  });

  describe('No raw throw new Error() in production code', () => {
    const THROW_ERROR_EXEMPT_PATTERNS = [
      '.test.ts',
      '.test.tsx',
      'seed.ts',
      'scripts/',
      'node_modules/',
      '.next/',
      'lib/test-utils.ts',
      'instrumentation.ts',
    ];

    const allTsFiles = findFiles(PROJECT_ROOT, /\.(ts|tsx)$/).filter(
      (file) => !THROW_ERROR_EXEMPT_PATTERNS.some((pattern) => file.includes(pattern)),
    );

    it('production files never use throw new Error()', () => {
      const violations: string[] = [];

      for (const file of allTsFiles) {
        const content = readFile(file);
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (/throw\s+new\s+Error\s*\(/.test(line)) {
            violations.push(`${toRelative(file)}:${i + 1}: ${line.trim()}`);
          }
        }
      }

      expect(
        violations,
        `Production code should use typed errors (ClientError, ServerError, ExternalServiceError) ` +
          `instead of throw new Error(). Violations:\n${violations.join('\n')}`,
      ).toHaveLength(0);
    });
  });

  describe('No console.* in production code', () => {
    const CONSOLE_EXEMPT_PATTERNS = [
      '.test.ts',
      '.test.tsx',
      'seed.ts',
      'scripts/',
      'node_modules/',
      '.next/',
      'lib/test-utils.ts',
    ];

    const CONSOLE_EXEMPT_FILES = [
      'app/error.tsx',
      'app/global-error.tsx',
      'app/(marketing)/error.tsx',
      'app/(auth)/error.tsx',
      'app/(app)/error.tsx',
      'lib/env.ts',
      'instrumentation.ts',
    ];

    const allTsFiles = findFiles(PROJECT_ROOT, /\.(ts|tsx)$/).filter(
      (file) => !CONSOLE_EXEMPT_PATTERNS.some((pattern) => file.includes(pattern)),
    );

    it('production files do not use console.* without eslint-disable', () => {
      const violations: string[] = [];

      for (const file of allTsFiles) {
        const relative = toRelative(file);

        if (CONSOLE_EXEMPT_FILES.includes(relative)) {
          continue;
        }

        const content = readFile(file);
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          if (/console\.\w+\s*\(/.test(line)) {
            const previousLine = i > 0 ? lines[i - 1] : '';
            const hasEslintDisable =
              line.includes('eslint-disable') || previousLine.includes('eslint-disable');

            if (!hasEslintDisable) {
              violations.push(`${relative}:${i + 1}: ${line.trim()}`);
            }
          }
        }
      }

      expect(
        violations,
        `Production code should use the structured logger instead of console.*. ` +
          `If console is truly required (e.g. Edge Runtime), add an eslint-disable comment with reason. ` +
          `Violations:\n${violations.join('\n')}`,
      ).toHaveLength(0);
    });
  });

  describe('MCP spec entries reference real routes on disk', () => {
    it('every spec action references a real API route (or catch-all-served path)', async () => {
      const { spec } = await import('@/lib/mcp/spec');

      const routeFiles = findFiles(path.join(PROJECT_ROOT, 'app', 'api'), /^route\.(ts|tsx)$/);
      const routeDirs = routeFiles.map((file) =>
        path.dirname(path.relative(path.join(PROJECT_ROOT, 'app'), file)),
      );

      const staleActions: string[] = [];

      for (const action of spec.actions) {
        const expectedDir = action.path.replace(/^\//, '');

        const hasMatchingRoute = routeDirs.some((routeDir) => {
          const normalizedRouteDir = routeDir.replace(/\[\.\.\.all\]/g, '');
          const normalizedEndpoint = expectedDir.replace(/\/+$/, '');
          return (
            normalizedRouteDir === normalizedEndpoint ||
            normalizedEndpoint.startsWith(normalizedRouteDir.replace(/\/+$/, ''))
          );
        });

        if (!hasMatchingRoute) {
          staleActions.push(`${action.name}: ${action.method} ${action.path}`);
        }
      }

      expect(
        staleActions,
        `The following MCP spec actions reference routes that do not exist on disk. ` +
          `Remove stale entries from lib/mcp/spec.ts:\n${staleActions.join('\n')}`,
      ).toHaveLength(0);
    });

    it('every spec page references a real page.tsx file', async () => {
      const { spec } = await import('@/lib/mcp/spec');

      const pageFiles = findFiles(PROJECT_ROOT, /^page\.tsx$/);
      const pagePaths = new Set(
        pageFiles
          .map((file) => {
            const rel = path.relative(PROJECT_ROOT, file);
            const withoutFile = rel.replace(/\/page\.tsx$/, '').replace(/^app\/?/, '');
            const cleaned = withoutFile.replace(/\([\w-]+\)\/?/g, '').replace(/\/+$/, '');
            return cleaned === '' ? '/' : `/${cleaned}`;
          })
          .filter((p) => !p.startsWith('/api')),
      );

      const stalePages: string[] = [];
      for (const page of spec.pages) {
        if (!pagePaths.has(page.path)) {
          stalePages.push(page.path);
        }
      }

      expect(
        stalePages,
        `The following MCP spec pages have no matching page.tsx file on disk. ` +
          `Remove stale entries from lib/mcp/spec.ts:\n${stalePages.join('\n')}`,
      ).toHaveLength(0);
    });
  });

  describe('No raw SQL in production code', () => {
    const SQL_EXEMPT_PATTERNS = [
      'lib/db/schema/',
      'lib/db/migrations/',
      'lib/db/seed.ts',
      'scripts/',
      'node_modules/',
      '.next/',
    ];

    // Match strings that START with a SQL keyword (after quote/whitespace).
    // Drizzle's sql`...` tagged templates are safe (parameterized) so we
    // only flag untagged string literals and template literals without the
    // sql tag.
    const SQL_AT_START = /^\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE\s+TABLE)\s/i;

    const allTsFiles = findFiles(PROJECT_ROOT, /\.(ts|tsx)$/).filter(
      (file) =>
        !SQL_EXEMPT_PATTERNS.some((pattern) => file.includes(pattern)) &&
        !file.endsWith('.test.ts') &&
        !file.endsWith('.test.tsx'),
    );

    it('production code does not contain raw SQL strings', () => {
      const violations: string[] = [];

      for (const file of allTsFiles) {
        const content = readFile(file);
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();

          if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
            continue;
          }

          // Skip Drizzle sql tagged templates - they are parameterized
          if (/\bsql\s*`/.test(line)) {
            continue;
          }

          // Check regular string literals (single/double quotes)
          const stringLiterals = line.match(/(['"])(.+?)\1/g) ?? [];
          for (const literal of stringLiterals) {
            const inner = literal.slice(1, -1);
            if (SQL_AT_START.test(inner)) {
              violations.push(`${toRelative(file)}:${i + 1}: ${trimmed}`);
            }
          }

          // Check untagged template literals (no sql` prefix)
          const templateLiterals = line.match(/(?<!sql\s*)`([^`]+)`/g) ?? [];
          for (const literal of templateLiterals) {
            const inner = literal.slice(1, -1);
            if (SQL_AT_START.test(inner)) {
              violations.push(`${toRelative(file)}:${i + 1}: ${trimmed}`);
            }
          }
        }
      }

      expect(
        violations,
        `Raw SQL found in production code. Use Drizzle schema builder for all queries. ` +
          `Violations:\n${violations.join('\n')}`,
      ).toHaveLength(0);
    });
  });

  describe('MCP tools use withMcpTool wrapper', () => {
    it('all server.tool() calls use withMcpTool as handler', () => {
      const mcpServerFile = fs.readFileSync(
        path.join(PROJECT_ROOT, 'lib', 'mcp', 'server.ts'),
        'utf8',
      );

      // Find all server.tool() registrations
      const toolCalls = mcpServerFile.match(/server\.tool\(/g) ?? [];
      // Find all withMcpTool usages as the handler argument
      const wrappedCalls = mcpServerFile.match(/withMcpTool\(/g) ?? [];

      expect(toolCalls.length, 'Expected at least one server.tool() registration').toBeGreaterThan(
        0,
      );

      expect(
        wrappedCalls.length,
        `Found ${toolCalls.length} server.tool() calls but only ${wrappedCalls.length} use withMcpTool(). ` +
          `Every MCP tool must use withMcpTool() for logging and error handling.`,
      ).toBe(toolCalls.length);
    });
  });
});
