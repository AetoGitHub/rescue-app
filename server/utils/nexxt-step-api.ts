import type { H3Event } from 'h3';
import { joinURL } from 'ufo';
import { forwardFetchError } from './forward-fetch-error';

const FILL_OC_BACKEND_PATH = '/api/nexxt-step/fill_oc/';
const API_KEY_HEADER = 'x-api-key';

/** La clave viaja en el enlace que reparte n8n; sin ella no hay acceso. */
export function requireNexxtStepApiKey(event: H3Event): string {
  const key = getHeader(event, API_KEY_HEADER)?.trim();

  if (!key) {
    throw createError({
      statusCode: 400,
      message: 'Falta la clave de acceso',
    });
  }

  return key;
}

export async function fetchFillOc<T>(
  event: H3Event,
  options: { method: 'GET' | 'POST'; body?: unknown },
): Promise<T> {
  const key = requireNexxtStepApiKey(event);
  const apiUrl = useRuntimeConfig().apiUrl?.trim() ?? '';

  if (!apiUrl) {
    throw createError({
      statusCode: 500,
      message: 'API no configurada',
    });
  }

  try {
    return await $fetch<T>(joinURL(apiUrl, FILL_OC_BACKEND_PATH), {
      method: options.method,
      body: options.body,
      headers: {
        Authorization: `Api-Key ${key}`,
        'Accept-Language': 'es',
      },
    });
  } catch (error) {
    forwardFetchError(error);
  }
}
