/** Cookie/session lifetime for nuxt-auth-utils (seconds). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Minimum gap between Django `/api/auth/refresh/` calls. */
export const AUTH_REFRESH_TTL_MS = 10 * 60 * 1000;

export const SESSION_EXPIRED_CODE = 'session_expired';

export const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró o no es válida';

export const REQUEST_ID_HEADER = 'x-request-id';

export function isAuthRefreshDue(
  tokenRefreshedAt: number | undefined,
  now = Date.now(),
): boolean {
  if (tokenRefreshedAt == null || !Number.isFinite(tokenRefreshedAt)) return true;
  return now - tokenRefreshedAt >= AUTH_REFRESH_TTL_MS;
}
