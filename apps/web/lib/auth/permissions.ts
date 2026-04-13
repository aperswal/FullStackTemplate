import { ROLE_HIERARCHY } from '@template/shared';
import type { UserRole } from '@template/shared';
import { ClientError } from '@/lib/errors';

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

const PERMISSIONS = {
  'pro:features': 'pro',
  'admin:manage-users': 'admin',
  'admin:view-analytics': 'admin',
  'pro:export-data': 'pro',
  'pro:api-access': 'pro',
} as const satisfies Record<string, UserRole>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const requiredRole = PERMISSIONS[permission];
  return hasMinimumRole(userRole, requiredRole);
}

export function requireRole(userRole: UserRole, requiredRole: UserRole): void {
  if (!hasMinimumRole(userRole, requiredRole)) {
    throw new ClientError(`Insufficient permissions: requires ${requiredRole} role`, {
      statusCode: 403,
      userMessage: 'You do not have permission to perform this action.',
    });
  }
}
