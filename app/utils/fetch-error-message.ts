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
  const skip = new Set(['detail', 'message', 'non_field_errors']);
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

function getFetchStatusCode(error: unknown): number | undefined {
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

export function getFetchErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'No se pudo completar la operación.';
  }

  const data = extractFetchErrorData(error);
  if (data) {
    const fromData = readErrorDataAsString(data);
    if (fromData) return fromData;
  }

  const err = error as Record<string, unknown>;

  if (typeof err.statusMessage === 'string' && err.statusMessage.trim()) {
    return err.statusMessage.trim();
  }

  if (typeof err.message === 'string' && err.message.trim()) {
    return err.message.trim();
  }

  return 'No se pudo completar la operación.';
}
