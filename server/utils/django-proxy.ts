import type { H3Event } from 'h3';
import { REQUEST_ID_HEADER } from '#shared/constants/session';
import { reportSessionAuthFailure } from './report-session-auth';
import {
  readUpstreamErrorBody,
  reportUpstreamProxyError,
} from './report-upstream-error';
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
  const start = performance.now();
  return proxyRequest(event, target, {
    headers: djangoProxyHeaders(token, requestId),
    async onResponse(_event, response) {
      // Tiempo que Django tardó en responder (red + su propio procesamiento),
      // aislado del pre-procesamiento de Nitro (ver Server-Timing "app").
      appendResponseHeader(event, 'Server-Timing', `django;dur=${(performance.now() - start).toFixed(1)}`);

      const status = response.status;

      if (status === 401 || status === 403) {
        reportSessionAuthFailure({
          reason: 'upstream_auth_failure',
          path: event.path,
          requestId,
          status,
          hadToken: true,
          refreshClearedSession: false,
        });
        return;
      }

      // `proxyRequest` reenvía la respuesta del backend externo sin lanzar
      // ninguna excepción, así que un 500 nunca llega al hook de error de
      // Nitro/Sentry por sí solo: hay que capturarlo explícitamente aquí.
      if (status >= 500) {
        reportUpstreamProxyError({
          target,
          method: event.method,
          status,
          path: event.path,
          requestId,
          body: await readUpstreamErrorBody(response),
        });
      }
    },
  });
}
