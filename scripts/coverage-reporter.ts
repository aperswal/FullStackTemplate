/**
 * AI-friendly coverage reporter - analyzes uncovered code and provides
 * actionable guidance for writing missing tests.
 *
 * Reads Istanbul-format coverage data from apps/web/coverage/coverage-final.json
 * and outputs structured suggestions for each uncovered line/branch.
 *
 * Usage:
 *   npx tsx scripts/coverage-reporter.ts
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, '..');
const COVERAGE_PATH = resolve(ROOT_DIR, 'apps/web/coverage/coverage-final.json');
const WEB_ROOT = resolve(ROOT_DIR, 'apps/web');

interface BranchMapping {
  type: string; // 'if', 'switch', 'cond-expr', 'binary-expr', 'default-arg'
  loc: { start: { line: number; column: number }; end: { line: number; column: number } };
  locations: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }>;
}

interface FileCoverage {
  path: string;
  statementMap: Record<string, { start: { line: number }; end: { line: number } }>;
  s: Record<string, number>;
  branchMap: Record<string, BranchMapping>;
  b: Record<string, number[]>;
  fnMap: Record<string, { name: string; loc: { start: { line: number }; end: { line: number } } }>;
  f: Record<string, number>;
}

interface CoverageReport {
  [filePath: string]: FileCoverage;
}

function getSourceLines(filePath: string): string[] | null {
  try {
    return readFileSync(filePath, 'utf-8').split('\n');
  } catch {
    return null;
  }
}

function getBranchDescription(type: string, branchIndex: number, totalBranches: number): string {
  switch (type) {
    case 'if':
      return branchIndex === 0
        ? 'if-true branch (condition is truthy)'
        : 'if-false/else branch (condition is falsy - even without an explicit else block, this path needs testing)';
    case 'switch':
      return `switch case #${branchIndex + 1} of ${totalBranches}`;
    case 'cond-expr':
      return branchIndex === 0
        ? 'ternary true branch (left side of ?:)'
        : 'ternary false branch (right side of ?:)';
    case 'binary-expr':
      return branchIndex === 0
        ? 'left side of logical expression (&&, ||, ??)'
        : 'right side of logical expression (short-circuit path)';
    case 'default-arg':
      return 'default parameter value (test with undefined/missing argument)';
    default:
      return `branch path #${branchIndex + 1}`;
  }
}

function main() {
  if (!existsSync(COVERAGE_PATH)) {
    console.error(`Coverage data not found at ${COVERAGE_PATH}`);
    console.error('Run "pnpm test:coverage" first to generate coverage data.');
    process.exit(1);
  }

  const coverage = JSON.parse(readFileSync(COVERAGE_PATH, 'utf-8')) as CoverageReport;
  let totalIssues = 0;

  for (const [, fileCoverage] of Object.entries(coverage)) {
    const relPath = relative(WEB_ROOT, fileCoverage.path);
    const sourceLines = getSourceLines(fileCoverage.path);
    const issues: string[] = [];

    // Uncovered functions
    for (const [fnId, count] of Object.entries(fileCoverage.f)) {
      if (count === 0) {
        const fn = fileCoverage.fnMap[fnId];
        if (!fn) continue;
        const line = fn.loc.start.line;
        const context = sourceLines?.[line - 1]?.trim() ?? '';
        issues.push(
          `  LINE ${line}: Function "${fn.name || '(anonymous)'}" never called\n` +
            `    Code: ${context}\n` +
            `    Suggestion: Add a test that calls this function and verifies its return value`,
        );
      }
    }

    // Uncovered branches
    for (const [branchId, counts] of Object.entries(fileCoverage.b)) {
      const branch = fileCoverage.branchMap[branchId];
      if (!branch) continue;

      for (let i = 0; i < counts.length; i++) {
        if (counts[i] === 0) {
          const loc = branch.locations[i] ?? branch.loc;
          const line = loc.start.line;
          const context = sourceLines?.[line - 1]?.trim() ?? '';
          const desc = getBranchDescription(branch.type, i, counts.length);
          issues.push(
            `  LINE ${line}: Untested ${branch.type} branch - ${desc}\n` +
              `    Code: ${context}\n` +
              `    Suggestion: Add a test that exercises this specific path`,
          );
        }
      }
    }

    // Uncovered statements (only report if not already covered by branch/function reports)
    const reportedLines = new Set<number>();
    for (const issue of issues) {
      const match = issue.match(/LINE (\d+)/);
      if (match) reportedLines.add(parseInt(match[1], 10));
    }

    for (const [stmtId, count] of Object.entries(fileCoverage.s)) {
      if (count === 0) {
        const stmt = fileCoverage.statementMap[stmtId];
        if (!stmt) continue;
        const line = stmt.start.line;
        if (reportedLines.has(line)) continue; // Already reported via branch/function

        const context = sourceLines?.[line - 1]?.trim() ?? '';
        // Detect try-catch patterns
        if (context.includes('catch')) {
          issues.push(
            `  LINE ${line}: Catch block never executed\n` +
              `    Code: ${context}\n` +
              `    Suggestion: Mock a dependency to throw an error and verify the catch block handles it correctly`,
          );
        } else {
          issues.push(
            `  LINE ${line}: Statement never executed\n` +
              `    Code: ${context}\n` +
              `    Suggestion: Add a test that reaches this code path`,
          );
        }
      }
    }

    if (issues.length > 0) {
      totalIssues += issues.length;
      console.log(`\nFILE: ${relPath}`);
      console.log(issues.join('\n\n'));
    }
  }

  if (totalIssues === 0) {
    console.log('All code paths are covered.');
  } else {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Total uncovered items: ${totalIssues}`);
    console.log(
      'Run "pnpm test:coverage" to regenerate the HTML report at apps/web/coverage/index.html',
    );
  }
}

main();
