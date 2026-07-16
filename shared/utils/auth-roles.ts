import type { AuthUserRole, AuthUser  } from '../types/user';


const AUTH_ROLE_ALIASES: Record<string, AuthUserRole> = {
  administrator: 'admin',
};

export function normalizeAuthRole(
  role: string | null | undefined,
): AuthUserRole | string | null {
  if (role == null) return null;

  const trimmed = role.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const aliased = AUTH_ROLE_ALIASES[lower];
  if (aliased) return aliased;

  return parseAuthUserRole(lower) ?? lower;
}

export function isAdminRole(role: string | null | undefined): boolean {
  return normalizeAuthRole(role) === 'admin';
}

export function isOperatorRole(role: string | null | undefined): boolean {
  return normalizeAuthRole(role) === 'operator';
}

export function isStaffRole(role: string | null | undefined): boolean {
  const normalized = normalizeAuthRole(role);
  return normalized === 'admin'
    || normalized === 'operator'
    || normalized === 'seller';
}

export function isUnauthorizedRole(role: string | null | undefined): boolean {
  return normalizeAuthRole(role) === 'client';
}

export function defaultHomeForRole(role: string | null | undefined): string {
  if (isUnauthorizedRole(role)) return '/unauthorized';
  return '/admin/operational';
}

export function parseAuthUserRole(role: string | null | undefined): AuthUserRole | null {
  if (role === 'admin' || role === 'operator' || role === 'seller' || role === 'client') {
    return role;
  }
  return null;
}

export function normalizeAuthUserRoleForSession(
  role: string | null | undefined,
): string {
  return normalizeAuthRole(role) ?? role?.trim() ?? '';
}

export function normalizeAuthSessionUser(
  user: AuthUser | null | undefined,
): AuthUser | null {
  if (!user) return null;

  return {
    ...user,
    role: normalizeAuthUserRoleForSession(user.role),
  };
}
