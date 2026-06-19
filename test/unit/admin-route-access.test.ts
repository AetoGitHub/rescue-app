import { describe, expect, it } from 'vitest';
import {
  accessAdministrative,
  accessCatalogs,
  accessMyBalance,
  accessOperational,
  accessUsers,
} from '../../shared/abilities';
import type { AuthUser } from '../../shared/types/user';
import { abilityForAdminPath } from '../../shared/utils/admin-route-access';
import {
  defaultHomeForRole,
  isAdminRole,
  isStaffRole,
  isUnauthorizedRole,
} from '../../shared/utils/auth-roles';
import { abilityForApiPath } from '../../shared/utils/admin-api-access';

function user(role: AuthUser['role']): AuthUser {
  return { id: 1, name: 'Test User', role };
}

async function canAccess(
  ability: { execute: (user: AuthUser | null, ...args: never[]) => unknown },
  role: AuthUser['role'],
): Promise<boolean> {
  const result = await ability.execute(user(role));
  return result === true || (typeof result === 'object' && result.authorized === true);
}

describe('auth-roles', () => {
  it('identifies staff and client roles', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isStaffRole('operator')).toBe(true);
    expect(isStaffRole('seller')).toBe(true);
    expect(isUnauthorizedRole('client')).toBe(true);
    expect(isStaffRole('client')).toBe(false);
  });

  it('returns role-based home paths', () => {
    expect(defaultHomeForRole('admin')).toBe('/admin/operational');
    expect(defaultHomeForRole('operator')).toBe('/admin/operational');
    expect(defaultHomeForRole('client')).toBe('/unauthorized');
  });
});

describe('abilityForAdminPath', () => {
  it('maps admin routes to the expected abilities', () => {
    expect(abilityForAdminPath('/admin/operational')).toBe(accessOperational);
    expect(abilityForAdminPath('/admin/my-balance')).toBe(accessMyBalance);
    expect(abilityForAdminPath('/admin/administrativo')).toBe(accessAdministrative);
    expect(abilityForAdminPath('/admin/catalogs/clients')).toBe(accessCatalogs);
    expect(abilityForAdminPath('/admin/users')).toBe(accessUsers);
  });
});

describe('abilityForApiPath', () => {
  it('maps api routes to the expected abilities', () => {
    expect(abilityForApiPath('/api/rescue/cards/')).toBe(accessOperational);
    expect(abilityForApiPath('/api/rescue/administrative/cards/')).toBe(
      accessAdministrative,
    );
    expect(abilityForApiPath('/api/catalogue/client/list/')).toBe(accessCatalogs);
    expect(abilityForApiPath('/api/payment/balance/operative/')).toBe(accessMyBalance);
  });
});

describe('abilities', () => {
  it('allows admin everywhere and blocks operator from admin-only areas', async () => {
    expect(await canAccess(accessCatalogs, 'admin')).toBe(true);
    expect(await canAccess(accessCatalogs, 'operator')).toBe(false);
    expect(await canAccess(accessOperational, 'operator')).toBe(true);
    expect(await canAccess(accessOperational, 'client')).toBe(false);
    expect(await canAccess(accessAdministrative, 'seller')).toBe(false);
  });
});
