import type { H3Event } from 'h3';
import { joinURL } from 'ufo';
import { forwardFetchError } from './forward-fetch-error';

const FILL_OC_BACKEND_PATH = '/api/nexxt-step/fill_oc/';
const API_KEY_HEADER = 'x-api-key';

export function isNexxtStepApiPath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path;
  return pathname.startsWith('/api/nexxt-step/');
}

/** Header que Django espera: `Authorization: Api-Key <key>`. */
export function djangoApiKeyAuthorization(key: string): string {
  return `Api-Key ${key.trim()}`;
}

function readQueryApiKey(event: H3Event): string {
  const raw = getQuery(event).key;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' ? value.trim() : '';
}

function readFillOcKeySource(event: H3Event): {
  key: string;
  source: 'query' | 'header' | 'missing';
} {
  const fromQuery = readQueryApiKey(event);
  if (fromQuery) return { key: fromQuery, source: 'query' };

  const fromHeader = getHeader(event, API_KEY_HEADER)?.trim() ?? '';
  if (fromHeader) return { key: fromHeader, source: 'header' };

  return { key: '', source: 'missing' };
}

function inspectDjangoFetchError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== 'object') {
    return { error: String(error) };
  }

  const err = error as Record<string, unknown>;
  return {
    statusCode: err.statusCode ?? err.status ?? null,
    statusMessage: err.statusMessage ?? null,
    message: err.message ?? null,
    data: err.data ?? null,
  };
}

/** La clave viene de `?key=` en el enlace; Nitro la reenvía a Django como Api-Key. */
export function requireNexxtStepApiKey(event: H3Event): string {
  const { key } = readFillOcKeySource(event);

  if (!key) {
    throw createError({
      statusCode: 400,
      message: 'Falta la clave de acceso',
      fatal: false,
    });
  }

  return key;
}

export async function fetchFillOc<T>(
  event: H3Event,
  options: { method: 'GET' | 'POST'; body?: unknown },
): Promise<T> {
  const { key, source } = readFillOcKeySource(event);

  if (!key) {
    throw createError({
      statusCode: 400,
      message: 'Falta la clave de acceso',
      fatal: false,
    });
  }

  const apiUrl = useRuntimeConfig().apiUrl?.trim() ?? '';

  if (!apiUrl) {
    throw createError({
      statusCode: 500,
      message: 'API no configurada',
      fatal: false,
    });
  }

  const target = joinURL(apiUrl, FILL_OC_BACKEND_PATH);
  const authorization = djangoApiKeyAuthorization(key);
  const headers = {
    Authorization: authorization,
    'Accept-Language': 'es',
  };

  console.info('[nexxt-step → django] request', {
    nitroPath: event.path,
    nitroMethod: event.method,
    keySource: source,
    keyLength: key.length,
    djangoUrl: target,
    djangoMethod: options.method,
    headers,
    body: options.body ?? null,
  });

  try {
    const result = await $fetch(target, {
      method: options.method,
      ...(options.body != null ? { body: options.body } : {}),
      headers,
    });
    console.info('[nexxt-step → django] ok', {
      djangoUrl: target,
      djangoMethod: options.method,
    });
    return result as T;
  } catch (error) {
    console.error('[nexxt-step → django] error', {
      djangoUrl: target,
      djangoMethod: options.method,
      headers,
      ...inspectDjangoFetchError(error),
    });
    // `fatal: false` evita que un 401/403 del backend ponga error.vue en el SSR.
    forwardFetchError(error, { fatal: false });
  }
}
