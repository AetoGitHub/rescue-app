import { describe, expect, it } from 'vitest';
import {
  accessAdminApp,
  accessAdministrative,
  accessClientApi,
  accessClientPortal,
  accessDropdown,
  accessOperational,
} from '../../shared/abilities';
import type { AuthUser } from '../../shared/types/user';
import { abilityForApiPath } from '../../shared/utils/admin-api-access';
import {
  CLIENT_HOME,
  isClientApiAllowed,
  isClientPageAllowed,
} from '../../shared/utils/client-access';

function user(role: AuthUser['role']): AuthUser {
  return { id: 1, name: 'Test User', role };
}

async function canAccess(
  ability: { execute: (user: AuthUser | null, ...args: never[]) => unknown },
  role: AuthUser['role'],
): Promise<boolean> {
  const result = await ability.execute(user(role));
  if (result === true) return true;
  if (result != null && typeof result === 'object' && 'authorized' in result) {
    return Boolean((result as { authorized: unknown }).authorized);
  }
  return false;
}

describe('client portal pages', () => {
  it('allows only the explicit portal pages and public links', () => {
    expect(isClientPageAllowed(CLIENT_HOME)).toBe(true);
    expect(isClientPageAllowed('/portal-cliente/por-cobrar')).toBe(true);
    expect(isClientPageAllowed('/portal-cliente/por-cobrar?page=2')).toBe(true);
    expect(isClientPageAllowed('/login')).toBe(true);
    expect(isClientPageAllowed('/rescue/10/evidencias')).toBe(true);
    expect(isClientPageAllowed('/admin/llenar-oc')).toBe(true);
  });

  it('denies everything else by default', () => {
    expect(isClientPageAllowed('/')).toBe(false);
    expect(isClientPageAllowed('/unauthorized')).toBe(false);
    expect(isClientPageAllowed('/portal-cliente')).toBe(false);
    expect(isClientPageAllowed('/portal-cliente/por-facturarX')).toBe(false);
    expect(isClientPageAllowed('/admin/por-facturar')).toBe(false);
    expect(isClientPageAllowed('/admin/operational')).toBe(false);
    expect(isClientPageAllowed('/admin/nueva-pantalla')).toBe(false);
    expect(isClientPageAllowed('/rescuex')).toBe(false);
  });
});

describe('client portal API', () => {
  it('routes only the explicit endpoints to accessClientApi', () => {
    expect(isClientApiAllowed('/api/client/pending_invoice/')).toBe(true);
    expect(isClientApiAllowed('/api/client/pending_charge/?cursor=abc')).toBe(true);
    expect(isClientApiAllowed('/api/client/by_responsible/')).toBe(true);
    expect(isClientApiAllowed('/api/dashboard/pending_charge/summary/')).toBe(true);
    expect(abilityForApiPath('/api/dashboard/pending_invoice/companies/dropdown/'))
      .toBe(accessClientApi);
    expect(abilityForApiPath('/api/client/company_matrix/3/clients/'))
      .toBe(accessClientApi);

    // Las listas de dashboard traen costo técnico: fuera de la lista del cliente.
    expect(isClientApiAllowed('/api/dashboard/pending_invoice/')).toBe(false);
    expect(isClientApiAllowed('/api/dashboard/pending_charge/')).toBe(false);
    expect(isClientApiAllowed('/api/dashboard/by_responsible/')).toBe(false);
    expect(isClientApiAllowed('/api/dashboard/company_matrix/')).toBe(false);
    expect(abilityForApiPath('/api/dashboard/pending_invoice/')).toBe(accessAdministrative);
    expect(abilityForApiPath('/api/dashboard/report/rescues/excel/?company=1'))
      .toBe(accessClientApi);

    expect(abilityForApiPath('/api/dashboard/other/')).toBe(accessAdministrative);
    expect(abilityForApiPath('/api/rescue/dropdown/')).toBe(accessDropdown);
    expect(abilityForApiPath('/api/unknown/')).toBe(accessAdminApp);
  });

  it('denies the client anything outside its list', async () => {
    expect(await canAccess(accessClientApi, 'client')).toBe(true);
    expect(await canAccess(accessClientApi, 'admin')).toBe(true);
    expect(await canAccess(accessClientApi, 'operator')).toBe(false);

    expect(await canAccess(accessDropdown, 'client')).toBe(false);
    expect(await canAccess(accessAdminApp, 'client')).toBe(false);
    expect(await canAccess(accessOperational, 'client')).toBe(false);
  });
});

describe('client portal ability', () => {
  it('lets clients and admins in, not the rest of the staff', async () => {
    expect(await canAccess(accessClientPortal, 'client')).toBe(true);
    expect(await canAccess(accessClientPortal, 'admin')).toBe(true);
    expect(await canAccess(accessClientPortal, 'operator')).toBe(false);
    expect(await canAccess(accessClientPortal, 'seller')).toBe(false);
  });
});
