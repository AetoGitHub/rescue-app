import { joinURL } from 'ufo';
import type { H3Event } from 'h3';
import type { AuthRefreshResponse } from '#shared/types/auth';
import {
  SESSION_MAX_AGE,
  isAuthRefreshDue,
} from '#shared/constants/session';
import { normalizeAuthUserRoleForSession } from '#shared/utils/auth-roles';
import { reportSessionAuthFailure } from './report-session-auth';
import { attachRequestId } from './request-id';
import { sessionExpiredError } from './session-expired';

export type RefreshableSession = {
  user?: {
    id: number;
    name: string;
    role: string;
    is_superuser?: boolean;
  };
  token?: string;
  tokenRefreshedAt?: number;
};

type SessionUser = NonNullable<RefreshableSession['user']>;

type RefreshOutcome =
  | { ok: true; skipped: true }
  | {
      ok: true;
      skipped?: false;
      user: SessionUser;
      token: string;
      tokenRefreshedAt: number;
    }
  | { ok: false };

export type AuthRefreshDeps = {
  fetch: (
    url: string,
    options?: { headers?: Record<string, string> },
  ) => Promise<AuthRefreshResponse>;
  getApiUrl: (event: H3Event) => string;
  setSession: (
    event: H3Event,
    data: RefreshableSession,
    config?: { maxAge: number },
  ) => Promise<void> | void;
  clearSession: (event: H3Event) => Promise<void> | void;
  now: () => number;
};

function defaultAuthRefreshDeps(): AuthRefreshDeps {
  return {
    fetch: async (url, options) =>
      (await $fetch(url, options)) as AuthRefreshResponse,
    getApiUrl: (event) => String(useRuntimeConfig(event).apiUrl ?? ''),
    setSession: async (event, data, config) => {
      await setUserSession(event, data, config);
    },
    clearSession: async (event) => {
      await clearUserSession(event);
    },
    now: () => Date.now(),
  };
}

function getFetchStatusCode(error: unknown): number | null {
  if (error == null || typeof error !== 'object') return null;
  const statusCode = Number(
    (error as { statusCode?: number; status?: number }).statusCode
      ?? (error as { status?: number }).status,
  );
  return Number.isFinite(statusCode) ? statusCode : null;
}

const refreshInFlight = new Map<string, Promise<RefreshOutcome>>();

export function resetAuthRefreshMutex() {
  refreshInFlight.clear();
}

async function performRefresh(
  event: H3Event,
  token: string,
  deps: AuthRefreshDeps,
  requestId: string | undefined,
): Promise<RefreshOutcome> {
  const target = joinURL(deps.getApiUrl(event), '/api/auth/refresh/');

  try {
    const response = await deps.fetch(target, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    const user = {
      id: response.id,
      name: response.name,
      role: normalizeAuthUserRoleForSession(response.role),
      is_superuser: Boolean(response.is_superuser),
    };

    return {
      ok: true,
      user,
      token: response.token,
      tokenRefreshedAt: deps.now(),
    };
  } catch (error) {
    const statusCode = getFetchStatusCode(error);
    if (statusCode === 401 || statusCode === 403) {
      reportSessionAuthFailure({
        reason: 'refresh_cleared_session',
        path: event.path,
        requestId,
        status: statusCode,
        hadToken: true,
        refreshClearedSession: true,
      });
      return { ok: false };
    }

    return { ok: true, skipped: true };
  }
}

export async function refreshAuthSession(
  event: H3Event,
  session: RefreshableSession,
  deps: AuthRefreshDeps = defaultAuthRefreshDeps(),
): Promise<void> {
  const token = session.token?.trim();
  if (!token) return;

  const requestId = attachRequestId(event);

  if (!isAuthRefreshDue(session.tokenRefreshedAt, deps.now())) return;

  let pending = refreshInFlight.get(token);
  if (!pending) {
    pending = performRefresh(event, token, deps, requestId).finally(() => {
      refreshInFlight.delete(token);
    });
    refreshInFlight.set(token, pending);
  }

  const outcome = await pending;

  if (!outcome.ok) {
    await deps.clearSession(event);
    session.user = undefined;
    session.token = undefined;
    session.tokenRefreshedAt = undefined;
    throw sessionExpiredError();
  }

  if (outcome.skipped) return;

  await deps.setSession(
    event,
    {
      user: outcome.user,
      token: outcome.token,
      tokenRefreshedAt: outcome.tokenRefreshedAt,
    },
    { maxAge: SESSION_MAX_AGE },
  );

  session.user = outcome.user;
  session.token = outcome.token;
  session.tokenRefreshedAt = outcome.tokenRefreshedAt;
}
