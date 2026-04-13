import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./queries', () => ({
  getSubscriptionByUserId: vi.fn(),
  updateUserRole: vi.fn(),
}));

vi.mock('./plan-mapping', () => ({
  getRoleForPriceId: vi.fn(),
}));

import { getUserEntitlements, requireEntitlement, syncRoleFromSubscription } from './entitlements';
import { getSubscriptionByUserId, updateUserRole } from './queries';
import { getRoleForPriceId } from './plan-mapping';

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

  it('throws ClientError with 403 status', () => {
    try {
      requireEntitlement('free', 'canExportData');
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
    }
  });

  it('includes the feature name in error message', () => {
    expect(() => requireEntitlement('free', 'canAccessAPI')).toThrow('canAccessAPI');
  });

  it('includes the role name in error message', () => {
    expect(() => requireEntitlement('free', 'canManageUsers')).toThrow('free');
  });

  it('does not throw for admin canManageUsers', () => {
    expect(() => requireEntitlement('admin', 'canManageUsers')).not.toThrow();
  });
});

describe('syncRoleFromSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets role to free when no subscription exists', async () => {
    vi.mocked(getSubscriptionByUserId).mockResolvedValue(null);

    await syncRoleFromSubscription('user_1');

    expect(updateUserRole).toHaveBeenCalledWith('user_1', 'free', undefined);
  });

  it('sets role to free when subscription is canceled', async () => {
    vi.mocked(getSubscriptionByUserId).mockResolvedValue({
      id: 'sub_1',
      userId: 'user_1',
      status: 'canceled',
      externalPriceId: 'price_pro',
    } as any);

    await syncRoleFromSubscription('user_1');

    expect(updateUserRole).toHaveBeenCalledWith('user_1', 'free', undefined);
  });

  it('sets role from price ID when subscription is active', async () => {
    vi.mocked(getSubscriptionByUserId).mockResolvedValue({
      id: 'sub_1',
      userId: 'user_1',
      status: 'active',
      externalPriceId: 'price_pro',
    } as any);
    vi.mocked(getRoleForPriceId).mockReturnValue('pro');

    await syncRoleFromSubscription('user_1');

    expect(getRoleForPriceId).toHaveBeenCalledWith('price_pro');
    expect(updateUserRole).toHaveBeenCalledWith('user_1', 'pro', undefined);
  });

  it('sets role to free when price ID has no mapped role', async () => {
    vi.mocked(getSubscriptionByUserId).mockResolvedValue({
      id: 'sub_1',
      userId: 'user_1',
      status: 'active',
      externalPriceId: 'price_unknown',
    } as any);
    vi.mocked(getRoleForPriceId).mockReturnValue(null);

    await syncRoleFromSubscription('user_1');

    expect(updateUserRole).toHaveBeenCalledWith('user_1', 'free', undefined);
  });

  it('passes dbOrTx through to queries', async () => {
    vi.mocked(getSubscriptionByUserId).mockResolvedValue(null);
    const mockTx = {} as any;

    await syncRoleFromSubscription('user_1', mockTx);

    expect(getSubscriptionByUserId).toHaveBeenCalledWith('user_1', mockTx);
    expect(updateUserRole).toHaveBeenCalledWith('user_1', 'free', mockTx);
  });
});
