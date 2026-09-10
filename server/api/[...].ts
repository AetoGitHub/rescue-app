import { joinURL } from 'ufo';
import { abilityForApiPath } from '#shared/utils/admin-api-access';
import { fetchFillOc, isNexxtStepApiPath } from '../utils/nexxt-step-api';
import {
  proxyDjangoRequest,
  requireProxySession,
} from '../utils/django-proxy';

export default defineEventHandler(async (event) => {
  /**
   * fill_oc no usa la sesión: Django autentica con `Authorization: Api-Key`.
   * Si esta ruta catch-all gana al handler dedicado, no debemos mandar Token.
   */
  if (isNexxtStepApiPath(event.path)) {
    const method = event.method === 'POST' ? 'POST' : 'GET';
    return await fetchFillOc(event, {
      method,
      body: method === 'POST' ? await readBody(event) : undefined,
    });
  }

  const start = performance.now();
  const { token, requestId } = await requireProxySession(event);
  const apiUrl = useRuntimeConfig().apiUrl;

  await authorize(event, abilityForApiPath(event.path));

  // Cuánto tarda nuestro propio pre-procesamiento (sesión + permisos) antes
  // de siquiera llamar a Django, para diferenciarlo de la latencia upstream.
  appendResponseHeader(event, 'Server-Timing', `app;dur=${(performance.now() - start).toFixed(1)}`);

  const target = joinURL(apiUrl, event.path);

  return proxyDjangoRequest(event, target, token, requestId);
});
