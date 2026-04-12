import { describe, it, expect } from 'vitest';

import { hasMinimumRole, hasPermission, requireRole } from './permissions';

describe('hasMinimumRole', () => {
  it('free has minimum role of free', () => {
    expect(hasMinimumRole('free', 'free')).toBe(true);
  });

  it('free does not have minimum role of pro', () => {
    expect(hasMinimumRole('free', 'pro')).toBe(false);
  });

  it('pro has minimum role of free', () => {
    expect(hasMinimumRole('pro', 'free')).toBe(true);
  });

  it('pro has minimum role of pro', () => {
    expect(hasMinimumRole('pro', 'pro')).toBe(true);
  });

  it('admin has minimum role of any level', () => {
    expect(hasMinimumRole('admin', 'free')).toBe(true);
    expect(hasMinimumRole('admin', 'pro')).toBe(true);
    expect(hasMinimumRole('admin', 'admin')).toBe(true);
  });
});

describe('hasPermission', () => {
  it('free cannot access pro features', () => {
    expect(hasPermission('free', 'pro:features')).toBe(false);
  });

  it('pro can access pro features', () => {
    expect(hasPermission('pro', 'pro:features')).toBe(true);
  });

  it('admin can access pro features', () => {
    expect(hasPermission('admin', 'pro:features')).toBe(true);
  });

  it('pro cannot manage users', () => {
    expect(hasPermission('pro', 'admin:manage-users')).toBe(false);
  });

  it('admin can manage users', () => {
    expect(hasPermission('admin', 'admin:manage-users')).toBe(true);
  });
});

describe('requireRole', () => {
  it('does not throw when role meets requirement', () => {
    expect(() => requireRole('pro', 'pro')).not.toThrow();
    expect(() => requireRole('admin', 'pro')).not.toThrow();
  });

  it('throws when role is insufficient', () => {
    expect(() => requireRole('free', 'pro')).toThrow('Insufficient permissions');
  });
});
