import { defineAbility } from 'nuxt-authorization/utils';
import type { AuthUser } from './types/user';
import { isAdminRole, isStaffRole } from './utils/auth-roles';

export const accessAdminApp = defineAbility((user: AuthUser) => isStaffRole(user.role));

export const accessOperational = defineAbility((user: AuthUser) => isStaffRole(user.role));

export const accessMyBalance = defineAbility((user: AuthUser) => isStaffRole(user.role));

export const accessAdministrative = defineAbility((user: AuthUser) => isAdminRole(user.role));

export const accessCatalogs = defineAbility((user: AuthUser) => isAdminRole(user.role));

export const accessUsers = defineAbility((user: AuthUser) => isAdminRole(user.role));

export const accessConfig = defineAbility((user: AuthUser) => isAdminRole(user.role));

export type AdminAbility =
  | typeof accessAdminApp
  | typeof accessOperational
  | typeof accessMyBalance
  | typeof accessAdministrative
  | typeof accessCatalogs
  | typeof accessUsers
  | typeof accessConfig;
