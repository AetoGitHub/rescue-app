import { joinURL } from 'ufo';
import type { H3Event } from 'h3';
import type { UserSession } from '#auth-utils';
import type { AuthRefreshResponse } from '#shared/types/auth';
import { SESSION_MAX_AGE } from '#shared/constants/session';
import { normalizeAuthUserRoleForSession } from '#shared/utils/auth-roles';

function getFetchStatusCode(error: unknown): number | null {
  if (error == null || typeof error !== 'object') return null;
  const statusCode = Number(
    (error as { statusCode?: number; status?: number }).statusCode
      ?? (error as { status?: number }).status,
  );
  return Number.isFinite(statusCode) ? statusCode : null;
}

export async function refreshAuthSession(
  event: H3Event,
  session: UserSession,
): Promise<void> {
  const token = session.token;
  if (!token?.trim()) return;

  const apiUrl = useRuntimeConfig(event).apiUrl;
  const target = joinURL(apiUrl, '/api/auth/refresh/');

  try {
    const response = await $fetch<AuthRefreshResponse>(target, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    const user = {
      id: response.id,
      name: response.name,
      role: normalizeAuthUserRoleForSession(response.role),
    };

    await setUserSession(
      event,
      {
        user,
        token: response.token,
      },
      { maxAge: SESSION_MAX_AGE },
    );

    session.user = user;
    session.token = response.token;
  } catch (error) {
    const statusCode = getFetchStatusCode(error);
    if (statusCode === 401 || statusCode === 403) {
      await clearUserSession(event);
      session.user = undefined;
      session.token = undefined;
      return;
    }
  }
}
