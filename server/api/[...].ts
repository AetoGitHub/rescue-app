import { joinURL } from 'ufo';
import { abilityForApiPath } from '#shared/utils/admin-api-access';
import { fetchFillOc, isNexxtStepApiPath } from '../utils/nexxt-step-api';

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

  const session = await requireUserSession(event);
  const token = session?.token;
  const apiUrl = useRuntimeConfig().apiUrl;

  await authorize(event, abilityForApiPath(event.path));

  const target = joinURL(apiUrl, event.path);

  return proxyRequest(event, target, {
    headers: {
      Authorization: `Token ${token}`,
      'Accept-Language': 'es',
    },
  });
});
