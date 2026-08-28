import { joinURL } from 'ufo';
import { abilityForApiPath } from '#shared/utils/admin-api-access';
import { parseRescueGuestIdParam } from '../../../../utils/rescue-guest-api';
import {
  proxyDjangoRequest,
  requireProxySession,
} from '../../../../utils/django-proxy';

export default defineEventHandler(async (event) => {
  const rescueId = parseRescueGuestIdParam(getRouterParam(event, 'id'));
  if (rescueId == null) {
    throw createError({
      statusCode: 400,
      message: 'Rescate no válido',
    });
  }

  const { token, requestId } = await requireProxySession(event);
  const apiUrl = useRuntimeConfig().apiUrl;

  await authorize(event, abilityForApiPath(event.path));

  const target = joinURL(
    apiUrl,
    `/api/rescue/approve_link/${rescueId}/generate/`,
  );

  return proxyDjangoRequest(event, target, token, requestId);
});
