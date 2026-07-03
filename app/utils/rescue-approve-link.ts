import { GUEST_AUTHORIZATION_PATH_SEGMENT } from '~/constants/rescue-approve-link-api';

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractTokenFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url, 'http://localhost').pathname;
    const segments = pathname.split('/').filter(Boolean);
    const authorizationIndex = segments.indexOf(GUEST_AUTHORIZATION_PATH_SEGMENT);
    if (authorizationIndex === -1 || authorizationIndex >= segments.length - 1) {
      return null;
    }
    return decodeURIComponent(segments[authorizationIndex + 1] ?? '');
  } catch {
    return null;
  }
}

/** Arma la ruta pública relativa del link de autorización. */
export function buildGuestAuthorizationPath(
  rescueId: number,
  token: string,
): string {
  const encodedToken = encodeURIComponent(token.trim());
  return `/rescue/${rescueId}/${GUEST_AUTHORIZATION_PATH_SEGMENT}/${encodedToken}`;
}

/** URL absoluta del link público de autorización. */
export function buildGuestAuthorizationUrl(
  rescueId: number,
  token: string,
  origin?: string,
): string {
  const path = buildGuestAuthorizationPath(rescueId, token);
  const baseOrigin = origin?.trim();
  if (!baseOrigin) return path;
  return `${baseOrigin.replace(/\/$/, '')}${path}`;
}

/** Arma el link de autorización a partir de la respuesta de generate (`api_key` = token). */
export function buildGuestAuthorizationUrlFromGenerateResponse(
  rescueId: number,
  body: unknown,
  origin?: string,
): string | null {
  const token = extractApproveTokenFromGenerateResponse(body);
  if (!token) return null;
  return buildGuestAuthorizationUrl(rescueId, token, origin);
}

function normalizeGenerateResponseBody(body: unknown): unknown {
  if (Array.isArray(body)) {
    return body[0] ?? null;
  }

  if (body != null && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    for (const key of ['data', 'result', 'response', 'body'] as const) {
      const nested = record[key];
      if (Array.isArray(nested)) {
        return nested[0] ?? null;
      }
    }
  }

  return body;
}

function unwrapGenerateResponseRecord(body: unknown): Record<string, unknown> | null {
  const normalized = normalizeGenerateResponseBody(body);
  if (normalized == null || typeof normalized !== 'object' || Array.isArray(normalized)) {
    return null;
  }

  const record = normalized as Record<string, unknown>;
  if (
    readNonEmptyString(record.api_key)
    || readNonEmptyString(record.apiKey)
  ) {
    return record;
  }

  for (const key of ['data', 'result', 'response', 'body'] as const) {
    const nested = record[key];
    if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
      const nestedRecord = nested as Record<string, unknown>;
      if (
        readNonEmptyString(nestedRecord.api_key)
        || readNonEmptyString(nestedRecord.apiKey)
      ) {
        return nestedRecord;
      }
    }
  }

  return record;
}

/**
 * Extrae el token de la respuesta de generate.
 * El backend devuelve un arreglo; se usa el primer `api_key`.
 */
export function extractApproveTokenFromGenerateResponse(
  body: unknown,
): string | null {
  if (body == null) return null;

  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (!trimmed) return null;
    const fromUrl = extractTokenFromUrl(trimmed);
    return fromUrl ?? trimmed;
  }

  const record = unwrapGenerateResponseRecord(body);
  if (!record) return null;

  const direct =
    readNonEmptyString(record.api_key)
    ?? readNonEmptyString(record.apiKey)
    ?? readNonEmptyString(record.token)
    ?? readNonEmptyString(record.approve_token);
  if (direct) return direct;

  const url =
    readNonEmptyString(record.url)
    ?? readNonEmptyString(record.approve_url);
  if (url) {
    const fromUrl = extractTokenFromUrl(url);
    if (fromUrl) return fromUrl;
    return url;
  }

  return null;
}
