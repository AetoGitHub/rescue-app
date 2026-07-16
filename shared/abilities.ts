import { defineAbility } from 'nuxt-authorization/utils';
import type { AuthUser } from './types/user';
import { isAdminRole, isStaffRole } from './utils/auth-roles';

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

/** Any authenticated role may consume dropdown lookup endpoints. */
export const accessDropdown = defineAbility((user: AuthUser) => Boolean(user));

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
  | typeof accessDropdown;
