/**
 * Coverage ratchet — prevents coverage from decreasing between PRs.
 *
 * Compares current coverage (from apps/web/coverage/coverage-summary.json)
 * against the baseline (.coverage-baseline.json at repo root).
 *
 * Usage:
 *   npx tsx scripts/coverage-ratchet.ts          # Check against baseline
 *   npx tsx scripts/coverage-ratchet.ts --update  # Update baseline to current
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, '..');
const SUMMARY_PATH = resolve(ROOT_DIR, 'apps/web/coverage/coverage-summary.json');
const BASELINE_PATH = resolve(ROOT_DIR, '.coverage-baseline.json');

interface CoverageMetrics {
  lines: { pct: number };
  branches: { pct: number };
  functions: { pct: number };
  statements: { pct: number };
}

interface CoverageSummary {
  total: CoverageMetrics;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

const metrics = ['lines', 'branches', 'functions', 'statements'] as const;

function main() {
  const isUpdate = process.argv.includes('--update');

  if (!existsSync(SUMMARY_PATH)) {
    console.error(`Coverage summary not found at ${SUMMARY_PATH}`);
    console.error('Run "pnpm test:coverage" first to generate coverage data.');
    process.exit(1);
  }

  const current = readJson<CoverageSummary>(SUMMARY_PATH);

  if (isUpdate) {
    const baseline: Record<string, number> = {};
    for (const m of metrics) {
      baseline[m] = current.total[m].pct;
    }
    writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
    console.log('Coverage baseline updated:');
    for (const m of metrics) {
      console.log(`  ${m}: ${baseline[m]}%`);
    }
    return;
  }

  if (!existsSync(BASELINE_PATH)) {
    console.log('No baseline found — creating initial baseline from current coverage.');
    const baseline: Record<string, number> = {};
    for (const m of metrics) {
      baseline[m] = current.total[m].pct;
    }
    writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
    console.log('Baseline created. Future PRs will be compared against this.');
    return;
  }

  const baseline = readJson<Record<string, number>>(BASELINE_PATH);
  let failed = false;

  console.log('Coverage Ratchet Check');
  console.log('='.repeat(50));
  console.log(`${'Metric'.padEnd(15)} ${'Baseline'.padEnd(12)} ${'Current'.padEnd(12)} Result`);
  console.log('-'.repeat(50));

  for (const m of metrics) {
    const base = baseline[m] ?? 0;
    const curr = current.total[m].pct;
    const diff = curr - base;
    const passed = diff >= -0.5; // Allow up to 0.5% decrease tolerance
    const status = passed ? 'PASS' : 'FAIL';

    if (!passed) failed = true;

    const diffStr = diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
    console.log(
      `${m.padEnd(15)} ${(base.toFixed(1) + '%').padEnd(12)} ${(curr.toFixed(1) + '%').padEnd(12)} ${status} (${diffStr})`,
    );
  }

  console.log('='.repeat(50));

  if (failed) {
    console.error(
      '\nCoverage regression detected. Add tests to bring coverage back up before merging.',
    );
    process.exit(1);
  }

  console.log('\nAll coverage metrics maintained or improved.');
}

main();
