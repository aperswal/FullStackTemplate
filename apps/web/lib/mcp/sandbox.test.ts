import { describe, it, expect } from 'vitest';

import { runSearch } from './sandbox';
import { spec } from './spec';

describe('runSearch', () => {
  it('returns all endpoints', async () => {
    const result = await runSearch('async () => spec.endpoints.map(e => e.path)', spec);
    const paths = JSON.parse(result) as string[];
    expect(paths).toContain('/api/health');
    expect(paths).toContain('/api/auth/sign-in/email');
  });

  it('filters endpoints by auth requirement', async () => {
    const result = await runSearch(
      'async () => spec.endpoints.filter(e => e.auth).map(e => e.path)',
      spec,
    );
    const paths = JSON.parse(result) as string[];
    expect(paths).toContain('/api/auth/sign-out');
    expect(paths).toContain('/api/auth/get-session');
    expect(paths).not.toContain('/api/health');
  });

  it('searches page routes by group', async () => {
    const result = await runSearch(
      'async () => spec.routes.filter(r => r.group === "app").map(r => r.path)',
      spec,
    );
    const paths = JSON.parse(result) as string[];
    expect(paths).toContain('/dashboard');
    expect(paths).toContain('/settings');
    expect(paths).not.toContain('/pricing');
  });

  it('queries database schemas', async () => {
    const result = await runSearch('async () => spec.schemas.map(s => s.table)', spec);
    const tables = JSON.parse(result) as string[];
    expect(tables).toContain('user');
    expect(tables).toContain('subscription');
  });

  it('finds columns on a specific table', async () => {
    const result = await runSearch(
      'async () => spec.schemas.find(s => s.table === "user").columns.map(c => c.name)',
      spec,
    );
    const columns = JSON.parse(result) as string[];
    expect(columns).toContain('email');
    expect(columns).toContain('role');
  });

  it('rejects code that exceeds timeout', async () => {
    await expect(runSearch('async () => { while(true) {} }', spec)).rejects.toThrow();
  }, 10_000);

  it('cannot access process or require', async () => {
    await expect(runSearch('async () => process.env', spec)).rejects.toThrow();
  });
});
