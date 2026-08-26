import * as Sentry from '@sentry/nuxt';
import { isRescueQuoteNotFoundError } from '~/utils/rescue-quote-not-found';

const SKIP_STATUSES = new Set([401, 403, 404]);

export type ApiResponseErrorContext = {
  request: unknown;
  response?: { status?: number; _data?: unknown };
  options?: { method?: string };
  error?: Error;
};

export function requestPathFromFetchRequest(request: unknown): string {
  if (typeof request === 'string') return request;
  if (request instanceof URL) return `${request.pathname}${request.search}`;
  if (typeof Request !== 'undefined' && request instanceof Request) {
    return request.url;
  }
  return '';
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
export function reportApiResponseError(ctx: ApiResponseErrorContext) {
  if (!shouldReportApiResponseError(ctx)) return;

  const status = ctx.response?.status;
  const path = requestPathFromFetchRequest(ctx.request);
  const method = (ctx.options?.method ?? 'GET').toUpperCase();
  const error =
    ctx.error
    ?? new Error(`${method} ${path}: ${status}`);

  Sentry.captureException(error, {
    extra: {
      path,
      method,
      status,
      data: ctx.response?._data,
    },
    tags: {
      http_status: String(status ?? 'unknown'),
    },
  });
}
