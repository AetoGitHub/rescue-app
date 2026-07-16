import { describe, expect, it } from 'vitest';
import {
  accessAdministrative,
  accessCatalogs,
  accessConfig,
  accessDropdown,
  accessMyBalance,
  accessOperational,
  accessPaymentReceipts,
  accessPayments,
  accessUsers,
} from '../../shared/abilities';
import type { AuthUser } from '../../shared/types/user';
import { abilityForAdminPath } from '../../shared/utils/admin-route-access';
import {
  defaultHomeForRole,
  isAdminRole,
  isStaffRole,
  isUnauthorizedRole,
  normalizeAuthRole,
  normalizeAuthSessionUser,
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
  if (result === true) return true;
  if (
    result != null
    && typeof result === 'object'
    && 'authorized' in result
  ) {
    return (result as { authorized: boolean }).authorized === true;
  }
  return false;
}

describe('auth-roles', () => {
  it('identifies staff and client roles', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isStaffRole('operator')).toBe(true);
    expect(isStaffRole('seller')).toBe(true);
    expect(isUnauthorizedRole('client')).toBe(true);
    expect(isStaffRole('client')).toBe(false);
  });

  it('normalizes role casing, spacing, and aliases', () => {
    expect(normalizeAuthRole(' Admin ')).toBe('admin');
    expect(normalizeAuthRole('ADMINISTRATOR')).toBe('admin');
    expect(isAdminRole('Admin')).toBe(true);
    expect(isAdminRole(' administrator ')).toBe(true);
    expect(isStaffRole(' Operator ')).toBe(true);
  });

  it('normalizes session user role for authorization resolvers', () => {
    expect(
      normalizeAuthSessionUser({ id: 1, name: 'Admin User', role: ' Admin ' }),
    ).toEqual({
      id: 1,
      name: 'Admin User',
      role: 'admin',
    });
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
    expect(abilityForAdminPath('/admin/pagar')).toBe(accessPayments);
    expect(abilityForAdminPath('/admin/pagar/recibos')).toBe(accessPaymentReceipts);
    expect(abilityForAdminPath('/admin/pagar/recibo/42')).toBe(accessPaymentReceipts);
    expect(abilityForAdminPath('/admin/configuracion/comisiones')).toBe(accessConfig);
  });
});

describe('abilityForApiPath', () => {
  it('maps api routes to the expected abilities', () => {
    expect(abilityForApiPath('/api/rescue/cards/')).toBe(accessOperational);
    expect(abilityForApiPath('/api/rescue/administrative/cards/')).toBe(
      accessAdministrative,
    );
    expect(abilityForApiPath('/api/catalogue/client/list/')).toBe(accessCatalogs);
    expect(
      abilityForApiPath('/api/catalogue/multipurpose/dropdown/?type=cancellation_reason'),
    ).toBe(accessDropdown);
    expect(abilityForApiPath('/api/catalogue/client/dropdown/')).toBe(accessDropdown);
    expect(abilityForApiPath('/api/auth/user/dropdown/')).toBe(accessDropdown);
    expect(abilityForApiPath('/api/rescue/dropdown/')).toBe(accessDropdown);
    expect(abilityForApiPath('/api/catalogue/client/detail/1/')).toBe(accessOperational);
    expect(abilityForApiPath('/api/payment/balance/operative/')).toBe(accessMyBalance);
    expect(abilityForApiPath('/api/payment/operative/')).toBe(accessPayments);
    expect(abilityForApiPath('/api/payment/cart/')).toBe(accessPayments);
    expect(abilityForApiPath('/api/payment/receipt/')).toBe(accessPaymentReceipts);
    expect(abilityForApiPath('/api/payment/receipt/42/')).toBe(accessPaymentReceipts);
    expect(abilityForApiPath('/api/sla/list/')).toBe(accessConfig);
    expect(abilityForApiPath('/api/auth/operative/commission/')).toBe(accessConfig);
    expect(abilityForApiPath('/api/auth/user/list/')).toBe(accessUsers);
  });
});

describe('abilities', () => {
  it('allows admin everywhere and blocks operator from admin-only areas', async () => {
    expect(await canAccess(accessCatalogs, 'admin')).toBe(true);
    expect(await canAccess(accessCatalogs, 'operator')).toBe(false);
    expect(await canAccess(accessOperational, 'operator')).toBe(true);
    expect(await canAccess(accessOperational, 'client')).toBe(false);
    expect(await canAccess(accessAdministrative, 'seller')).toBe(false);
    expect(await canAccess(accessAdministrative, 'Admin')).toBe(true);
    expect(await canAccess(accessConfig, 'administrator')).toBe(true);
    expect(await canAccess(accessPayments, 'admin')).toBe(true);
    expect(await canAccess(accessPayments, 'operator')).toBe(false);
    expect(await canAccess(accessPaymentReceipts, 'admin')).toBe(true);
    expect(await canAccess(accessPaymentReceipts, 'operator')).toBe(true);
    expect(await canAccess(accessPaymentReceipts, 'seller')).toBe(true);
    expect(await canAccess(accessPaymentReceipts, 'client')).toBe(false);
    expect(await canAccess(accessAdministrative, 'operator')).toBe(false);
    expect(await canAccess(accessDropdown, 'admin')).toBe(true);
    expect(await canAccess(accessDropdown, 'operator')).toBe(true);
    expect(await canAccess(accessDropdown, 'seller')).toBe(true);
    expect(await canAccess(accessDropdown, 'client')).toBe(true);
  });
});
