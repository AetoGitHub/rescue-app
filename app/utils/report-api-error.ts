import * as Sentry from '@sentry/nuxt';
import { REQUEST_ID_HEADER } from '#shared/constants/session';
import { isRescueQuoteNotFoundError } from '~/utils/rescue-quote-not-found';

const SKIP_STATUSES = new Set([404]);
const SENSITIVE_KEY = /password|token|authorization|secret|api[-_]?key/i;

export type ApiResponseErrorContext = {
  request: unknown;
  response?: {
    status?: number;
    _data?: unknown;
    headers?: Headers | Record<string, string>;
  };
  options?: { method?: string };
  error?: Error;
};

export type ApiResponseErrorMeta = {
  loggedIn?: boolean;
};

export function requestPathFromFetchRequest(request: unknown): string {
  if (typeof request === 'string') return request;
  if (request instanceof URL) return `${request.pathname}${request.search}`;
  if (typeof Request !== 'undefined' && request instanceof Request) {
    return request.url;
  }
  return '';
}

export function normalizeApiPath(path: string): string {
  const withoutQuery = path.split('?')[0] ?? path;
  let pathname = withoutQuery;
  try {
    if (/^https?:\/\//i.test(withoutQuery)) {
      pathname = new URL(withoutQuery).pathname;
    }
  } catch {
    pathname = withoutQuery;
  }
  return pathname.replace(/\/\d+(?=\/|$)/g, '/:id');
}

export function sanitizeApiErrorData(data: unknown): unknown {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return data;
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : value;
  }
  return out;
}

export function requestIdFromResponseHeaders(
  headers: Headers | Record<string, string> | undefined,
): string | undefined {
  if (!headers) return undefined;
  if (typeof (headers as Headers).get === 'function') {
    const value =
      (headers as Headers).get(REQUEST_ID_HEADER)
      ?? (headers as Headers).get('X-Request-Id');
    return value?.trim() || undefined;
  }

  const record = headers as Record<string, string>;
  const value = record[REQUEST_ID_HEADER] ?? record['X-Request-Id'];
  return value?.trim() || undefined;
}

export function shouldReportApiResponseError(
  ctx: ApiResponseErrorContext,
): boolean {
  const status = ctx.response?.status;
  if (status == null || status < 400) return false;
  if (SKIP_STATUSES.has(status)) return false;

  const path = requestPathFromFetchRequest(ctx.request);
  if (path.includes('/api/auth/login')) return false;

  if (
    isRescueQuoteNotFoundError({
      data: ctx.response?._data,
      statusCode: status,
    })
  ) {
    return false;
  }

  return true;
}

/** Envía 4xx/5xx de `useApiFetch` a Sentry (el SDK de Nuxt ignora 4xx por defecto). */
export function reportApiResponseError(
  ctx: ApiResponseErrorContext,
  meta?: ApiResponseErrorMeta,
) {
  if (!shouldReportApiResponseError(ctx)) return;

  const status = ctx.response?.status;
  const path = requestPathFromFetchRequest(ctx.request);
  const apiPath = normalizeApiPath(path);
  const method = (ctx.options?.method ?? 'GET').toUpperCase();
  const error =
    ctx.error
    ?? new Error(`${method} ${apiPath}: ${status}`);

  Sentry.captureException(error, {
    extra: {
      path,
      method,
      status,
      data: sanitizeApiErrorData(ctx.response?._data),
      request_id: requestIdFromResponseHeaders(ctx.response?.headers),
      had_session: meta?.loggedIn,
    },
    tags: {
      http_status: String(status ?? 'unknown'),
      api_path: apiPath,
    },
    fingerprint: ['api-error', method, apiPath, String(status ?? 'unknown')],
  });
}
