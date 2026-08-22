import type { H3Event } from 'h3';
import { joinURL } from 'ufo';
import { forwardFetchError } from './forward-fetch-error';
import {
  djangoApiKeyAuthorization,
  requireNexxtStepApiKey,
} from './nexxt-step-api';

const AUTH_API_KEY_TOKEN_BACKEND_PATH = '/api/auth/api-key/token/';
const FILL_OC_STAFF_PREFIX = '/api/fill-oc/staff/';

export function djangoPathFromFillOcStaffRequest(pathname: string): string | null {
  const path = pathname.split('?')[0] ?? pathname;
  if (!path.startsWith(FILL_OC_STAFF_PREFIX)) return null;
  const rest = path.slice(FILL_OC_STAFF_PREFIX.length);
  if (!rest) return null;
  return `/api/${rest}`;
}

function readStaffToken(event: H3Event): string {
  const raw = getHeader(event, 'authorization')?.trim() ?? '';
  const match = raw.match(/^Token\s+(.+)$/i);
  const token = match?.[1]?.trim() ?? '';
  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Falta el token de chat',
      fatal: false,
    });
  }
  return token;
}

function resolveApiUrl(): string {
  const apiUrl = useRuntimeConfig().apiUrl?.trim() ?? '';
  if (!apiUrl) {
    throw createError({
      statusCode: 500,
      message: 'API no configurada',
      fatal: false,
    });
  }
  return apiUrl;
}

export async function fetchDjangoApiKeyToken(event: H3Event): Promise<unknown> {
  const key = requireNexxtStepApiKey(event);
  const target = joinURL(resolveApiUrl(), AUTH_API_KEY_TOKEN_BACKEND_PATH);

  try {
    return await $fetch(target, {
      headers: {
        Authorization: djangoApiKeyAuthorization(key),
        'Accept-Language': 'es',
      },
    });
  } catch (error) {
    forwardFetchError(error, { fatal: false });
  }
}

export async function proxyFillOcStaffRequest(event: H3Event): Promise<unknown> {
  const token = readStaffToken(event);
  const djangoPath = djangoPathFromFillOcStaffRequest(getRequestURL(event).pathname);
  if (!djangoPath) {
    throw createError({
      statusCode: 404,
      message: 'Ruta no válida',
      fatal: false,
    });
  }

  const query = getQuery(event);
  const method = event.method;
  const target = joinURL(resolveApiUrl(), djangoPath);

  try {
    return await $fetch(target, {
      method,
      query,
      ...(method === 'GET' || method === 'HEAD' ? {} : { body: await readBody(event) }),
      headers: {
        Authorization: `Token ${token}`,
        'Accept-Language': 'es',
      },
    });
  } catch (error) {
    forwardFetchError(error, { fatal: false });
  }
}
