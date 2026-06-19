import type { AuthUserRole } from '../types/user';

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin';
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'operator' || role === 'seller';
}

export function isUnauthorizedRole(role: string | null | undefined): boolean {
  return role === 'client';
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
