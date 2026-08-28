import type { H3Event } from 'h3';
import { REQUEST_ID_HEADER } from '#shared/constants/session';
import { reportSessionAuthFailure } from './report-session-auth';
import { attachRequestId } from './request-id';
import { sessionExpiredError } from './session-expired';

export function djangoProxyHeaders(token: string, requestId: string) {
  return {
    Authorization: `Token ${token}`,
    'Accept-Language': 'es',
    [REQUEST_ID_HEADER]: requestId,
  };
}

export function assertSessionToken(
  token: unknown,
  context: { path: string; requestId: string },
): string {
  const value = typeof token === 'string' ? token.trim() : '';
  if (!value) {
    reportSessionAuthFailure({
      reason: 'missing_token',
      path: context.path,
      requestId: context.requestId,
      hadToken: false,
      refreshClearedSession: false,
    });
    throw sessionExpiredError();
  }
  return value;
}

export async function requireProxySession(event: H3Event) {
  const requestId = attachRequestId(event);
  const session = await requireUserSession(event);
  const token = assertSessionToken(session.token, {
    path: event.path,
    requestId,
  });
  return { session, token, requestId };
}

export function proxyDjangoRequest(
  event: H3Event,
  target: string,
  token: string,
  requestId: string,
) {
  return proxyRequest(event, target, {
    headers: djangoProxyHeaders(token, requestId),
    onResponse(_event, response) {
      const status = response.status;
      if (status !== 401 && status !== 403) return;
      reportSessionAuthFailure({
        reason: 'upstream_auth_failure',
        path: event.path,
        requestId,
        status,
        hadToken: true,
        refreshClearedSession: false,
      });
    },
  });
}
