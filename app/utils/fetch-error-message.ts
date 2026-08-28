import {
  SESSION_EXPIRED_CODE,
  SESSION_EXPIRED_MESSAGE,
} from '#shared/constants/session';

function stringifyDetail(detail: unknown): string | null {
  if (typeof detail === 'string') {
    const s = detail.trim();
    return s.length > 0 ? s : null;
  }
  if (Array.isArray(detail)) {
    const parts = detail
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : null;
  }
  return null;
}

function stringifyFieldErrors(data: Record<string, unknown>): string | null {
  const skip = new Set(['detail', 'message', 'non_field_errors', 'code']);
  const parts: string[] = [];

  for (const [key, val] of Object.entries(data)) {
    if (skip.has(key)) continue;
    if (typeof val === 'string' && val.trim()) {
      parts.push(`${key}: ${val.trim()}`);
    } else if (Array.isArray(val)) {
      const strs = val
        .filter((x): x is string => typeof x === 'string')
        .map((s) => s.trim())
        .filter(Boolean);
      if (strs.length) parts.push(`${key}: ${strs.join(', ')}`);
    }
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

function readErrorDataAsString(data: Record<string, unknown>): string | null {
  const fromDetail = stringifyDetail(data.detail);
  if (fromDetail) return fromDetail;

  const msg = data.message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();

  const nfe = stringifyDetail(data.non_field_errors);
  if (nfe) return nfe;

  return stringifyFieldErrors(data);
}

function containsLikelyUrl(text: string): boolean {
  return /https?:\/\//i.test(text);
}

const GENERIC_HTTP_REASON =
  /^(unauthorized|forbidden|bad request|not found|internal server error|bad gateway|gateway timeout|service unavailable|too many requests|conflict|request timeout)$/i;

const OFETCH_STATUS_LINE =
  /^\[(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\]/i;

const DRF_AUTH_DETAIL =
  /authentication credentials were not provided|invalid token|token expired|^not authenticated$/i;

export function isUnusableFetchErrorText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (containsLikelyUrl(trimmed)) return true;
  if (OFETCH_STATUS_LINE.test(trimmed)) return true;
  if (GENERIC_HTTP_REASON.test(trimmed)) return true;
  if (DRF_AUTH_DETAIL.test(trimmed)) return true;
  return false;
}

export function extractFetchErrorData(error: unknown): Record<string, unknown> | null {
  if (!error || typeof error !== 'object') return null;
  const err = error as Record<string, unknown>;

  const data = err.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  const response = err.response;
  if (response && typeof response === 'object') {
    const responseData = (response as { _data?: unknown })._data;
    if (
      responseData
      && typeof responseData === 'object'
      && !Array.isArray(responseData)
    ) {
      return responseData as Record<string, unknown>;
    }
  }

  return null;
}

/** Mensaje desde `data.detail` del API (DRF). */
export function getApiDetailMessage(error: unknown): string | null {
  const data = extractFetchErrorData(error);
  if (!data) return null;
  return stringifyDetail(data.detail);
}

function isSessionExpiredPayload(data: Record<string, unknown> | null): boolean {
  return data?.code === SESSION_EXPIRED_CODE;
}

export function getPasswordResetErrorMessage(error: unknown): string {
  const fromDetail = getApiDetailMessage(error);
  if (fromDetail) return fromDetail;

  const data = extractFetchErrorData(error);
  if (data) {
    const fallback = readErrorDataAsString(data);
    if (fallback) return fallback;
  }

  if (!error || typeof error !== 'object') {
    return 'No se pudo completar la operación.';
  }

  const err = error as Record<string, unknown>;
  const msg = typeof err.message === 'string' ? err.message.trim() : '';
  if (
    msg
    && !containsLikelyUrl(msg)
    && !/^\[POST\]|\[GET\]|Bad Request|Unauthorized/i.test(msg)
  ) {
    return msg;
  }

  return 'No se pudo completar la operación.';
}

export function getFetchStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const e = error as Record<string, unknown>;
  const c = e.statusCode ?? e.status;
  if (typeof c === 'number' && Number.isFinite(c)) return c;
  return undefined;
}

/**
 * Mensaje para pantalla de login: sin URLs ni `err.message` de ofetch/Nitro.
 * Prioriza códigos HTTP; solo usa texto del cuerpo JSON si no parece URL.
 */
export function getSafeLoginErrorMessage(error: unknown): string {
  const code = getFetchStatusCode(error);

  if (code === 401 || code === 403 || code === 400) {
    return 'Usuario o contraseña incorrectos.';
  }

  if (code != null && code >= 500) {
    return 'El servicio no está disponible. Intenta más tarde.';
  }

  if (!error || typeof error !== 'object') {
    return 'No se pudo iniciar sesión. Intenta de nuevo.';
  }

  const err = error as Record<string, unknown>;
  const data = err.data;

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const fromApi = readErrorDataAsString(data as Record<string, unknown>);
    if (fromApi && !containsLikelyUrl(fromApi)) {
      return fromApi;
    }
  }

  const msg = typeof err.message === 'string' ? err.message : '';
  if (
    /fetch failed|failed to fetch|network|load failed|ECONNREFUSED|ETIMEDOUT/i.test(
      msg,
    )
  ) {
    return 'No se pudo conectar con el servidor. Comprueba tu conexión.';
  }

  return 'No se pudo iniciar sesión. Intenta de nuevo.';
}

function usableApiMessage(data: Record<string, unknown> | null): string | null {
  if (!data) return null;
  const fromData = readErrorDataAsString(data);
  if (fromData && !isUnusableFetchErrorText(fromData)) return fromData;
  return null;
}

export function getFetchErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'No se pudo completar la operación.';
  }

  const data = extractFetchErrorData(error);
  if (isSessionExpiredPayload(data)) {
    return SESSION_EXPIRED_MESSAGE;
  }

  const code = getFetchStatusCode(error);
  const fromApi = usableApiMessage(data);
  if (fromApi) return fromApi;

  if (code === 401 || code === 403) {
    return SESSION_EXPIRED_MESSAGE;
  }

  const err = error as Record<string, unknown>;

  if (typeof err.statusMessage === 'string' && err.statusMessage.trim()) {
    const statusMessage = err.statusMessage.trim();
    if (!isUnusableFetchErrorText(statusMessage)) return statusMessage;
  }

  if (typeof err.message === 'string' && err.message.trim()) {
    const msg = err.message.trim();
    if (!isUnusableFetchErrorText(msg)) return msg;
  }

  return 'No se pudo completar la operación.';
}
