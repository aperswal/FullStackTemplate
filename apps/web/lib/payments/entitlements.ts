import type { UserRole } from '@template/shared';
import { ClientError } from '@/lib/errors';
import type { DbOrTx } from '@/lib/db';

import { getSubscriptionByUserId, updateUserRole } from './queries';
import { getRoleForPriceId } from './plan-mapping';

export async function syncRoleFromSubscription(userId: string, dbOrTx?: DbOrTx): Promise<void> {
  const sub = await getSubscriptionByUserId(userId, dbOrTx);

  if (!sub || sub.status === 'canceled') {
    await updateUserRole(userId, 'free', dbOrTx);
    return;
  }

  const role = getRoleForPriceId(sub.externalPriceId);
  if (role !== null) {
    await updateUserRole(userId, role, dbOrTx);
  } else {
    await updateUserRole(userId, 'free', dbOrTx);
  }
}

export interface UserEntitlements {
  canAccessProFeatures: boolean;
  canExportData: boolean;
  canAccessAPI: boolean;
  canManageUsers: boolean;
  maxProjects: number;
}

export function getUserEntitlements(role: UserRole): UserEntitlements {
  return {
    canAccessProFeatures: role === 'pro' || role === 'admin',
    canExportData: role === 'pro' || role === 'admin',
    canAccessAPI: role === 'pro' || role === 'admin',
    canManageUsers: role === 'admin',
    maxProjects: role === 'free' ? 1 : Infinity,
  };
}

export function requireEntitlement(role: UserRole, feature: keyof UserEntitlements): void {
  const entitlements = getUserEntitlements(role);
  if (entitlements[feature] === false || entitlements[feature] === 0) {
    throw new ClientError(`Upgrade required: ${feature} is not available on the ${role} plan`, {
      statusCode: 403,
    });
  }
}
