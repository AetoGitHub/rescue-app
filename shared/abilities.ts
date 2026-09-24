import { defineAbility } from 'nuxt-authorization/utils';
import type { AuthUser } from './types/user';
import { isAdminRole, isClientRole, isStaffRole } from './utils/auth-roles';

function withAdminBypass(check: (user: AuthUser) => boolean) {
  return (user: AuthUser) => isAdminRole(user.role) || check(user);
}

export const accessAdminApp = defineAbility(
  withAdminBypass((user: AuthUser) => isStaffRole(user.role)),
);

export const accessOperational = defineAbility(
  withAdminBypass((user: AuthUser) => isStaffRole(user.role)),
);

export const accessMyBalance = defineAbility(
  withAdminBypass((user: AuthUser) => isStaffRole(user.role)),
);

export const accessAdministrative = defineAbility(
  withAdminBypass((user: AuthUser) => isAdminRole(user.role)),
);

export const accessCatalogs = defineAbility(
  withAdminBypass((user: AuthUser) => isAdminRole(user.role)),
);

export const accessUsers = defineAbility(
  withAdminBypass((user: AuthUser) => isAdminRole(user.role)),
);

export const accessConfig = defineAbility(
  withAdminBypass((user: AuthUser) => isAdminRole(user.role)),
);

export const accessPayments = defineAbility(
  withAdminBypass((user: AuthUser) => isAdminRole(user.role)),
);

export const accessPaymentReceipts = defineAbility(
  withAdminBypass((user: AuthUser) => isStaffRole(user.role)),
);

/**
 * Dropdowns de catálogos para el staff. El cliente no los consume salvo los
 * que estén en su lista explícita (`shared/utils/client-access.ts`).
 */
export const accessDropdown = defineAbility(
  withAdminBypass((user: AuthUser) => isStaffRole(user.role)),
);

/** Páginas del portal de cliente (`/portal-cliente/*`). */
export const accessClientPortal = defineAbility(
  withAdminBypass((user: AuthUser) => isClientRole(user.role)),
);

/**
 * Endpoints de la lista explícita del cliente. Son rutas administrativas, así
 * que fuera del cliente solo el admin conserva el acceso que ya tenía.
 */
export const accessClientApi = defineAbility(
  withAdminBypass((user: AuthUser) => isClientRole(user.role)),
);

export type AdminAbility =
  | typeof accessAdminApp
  | typeof accessOperational
  | typeof accessMyBalance
  | typeof accessAdministrative
  | typeof accessCatalogs
  | typeof accessUsers
  | typeof accessConfig
  | typeof accessPayments
  | typeof accessPaymentReceipts
  | typeof accessDropdown
  | typeof accessClientPortal
  | typeof accessClientApi;
