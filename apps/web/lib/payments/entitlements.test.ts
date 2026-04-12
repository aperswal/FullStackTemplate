import { describe, it, expect } from 'vitest';

import { getUserEntitlements, requireEntitlement } from './entitlements';

describe('getUserEntitlements', () => {
  it('free users have limited access', () => {
    const entitlements = getUserEntitlements('free');
    expect(entitlements.canAccessProFeatures).toBe(false);
    expect(entitlements.canExportData).toBe(false);
    expect(entitlements.canAccessAPI).toBe(false);
    expect(entitlements.canManageUsers).toBe(false);
    expect(entitlements.maxProjects).toBe(1);
  });

  it('pro users have full feature access', () => {
    const entitlements = getUserEntitlements('pro');
    expect(entitlements.canAccessProFeatures).toBe(true);
    expect(entitlements.canExportData).toBe(true);
    expect(entitlements.canAccessAPI).toBe(true);
    expect(entitlements.canManageUsers).toBe(false);
    expect(entitlements.maxProjects).toBe(Infinity);
  });

  it('admin users have all access', () => {
    const entitlements = getUserEntitlements('admin');
    expect(entitlements.canAccessProFeatures).toBe(true);
    expect(entitlements.canManageUsers).toBe(true);
    expect(entitlements.maxProjects).toBe(Infinity);
  });
});

describe('requireEntitlement', () => {
  it('does not throw when user has entitlement', () => {
    expect(() => requireEntitlement('pro', 'canAccessProFeatures')).not.toThrow();
  });

  it('throws when user lacks entitlement', () => {
    expect(() => requireEntitlement('free', 'canAccessProFeatures')).toThrow('Upgrade required');
  });
});
