import * as Sentry from '@sentry/nuxt';

const SENSITIVE_KEY = /password|token|authorization|secret|api[-_]?key/i;

function sanitizeUpstreamBody(data: unknown): unknown {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return data;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : value;
  }
  return out;
}

/**
 * Lee el body de la respuesta del backend externo sin consumir el stream original
 * (la respuesta ya viene clonada desde `onResponse` de `proxyRequest`, así que esto
 * no afecta lo que se reenvía al cliente).
 */
export async function readUpstreamErrorBody(response: Response): Promise<unknown> {
  try {
    const text = await response.clone().text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text.slice(0, 2000);
    }
  } catch {
    return null;
  }
}

export type UpstreamProxyErrorContext = {
  target: string;
  method: string;
  status: number;
  path: string;
  requestId?: string;
  body: unknown;
};

/** Captura en Sentry el error crudo devuelto por el backend externo (Django) al proxyear una request. */
export function reportUpstreamProxyError(ctx: UpstreamProxyErrorContext) {
  const apiPath = ctx.path.split('?')[0] ?? ctx.path;

  Sentry.captureMessage(`upstream_proxy_error: ${ctx.method} ${apiPath}`, {
    level: 'error',
    extra: {
      target: ctx.target,
      path: ctx.path,
      method: ctx.method,
      status: ctx.status,
      request_id: ctx.requestId,
      upstream_body: sanitizeUpstreamBody(ctx.body),
    },
    tags: {
      http_status: String(ctx.status),
      api_path: apiPath,
    },
    fingerprint: ['upstream-proxy-error', ctx.method, apiPath, String(ctx.status)],
  });
}
