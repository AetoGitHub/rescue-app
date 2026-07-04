import { joinURL, withQuery } from 'ufo';
import { forwardFetchError } from '../../../../utils/forward-fetch-error';
import {
  parseRescueGuestIdParam,
  parseRescueGuestTokenParam,
  resolveRescueGuestApiUrl,
} from '../../../../utils/rescue-guest-api';

export default defineEventHandler(async (event) => {
  const rescueId = parseRescueGuestIdParam(getRouterParam(event, 'id'));
  const token = parseRescueGuestTokenParam(getRouterParam(event, 'token'));

  if (rescueId == null || token == null) {
    throw createError({
      statusCode: 400,
      message: 'Enlace no válido o expirado',
    });
  }

  const apiUrl = resolveRescueGuestApiUrl();
  if (!apiUrl) {
    throw createError({
      statusCode: 500,
      message: 'API no configurada',
    });
  }

  const query = getQuery(event);
  const cursor = typeof query.cursor === 'string' ? query.cursor : undefined;

  const target = withQuery(
    joinURL(
      apiUrl,
      `/api/chat/${rescueId}/messages/${encodeURIComponent(token)}/`,
    ),
    cursor ? { cursor } : undefined,
  );

  try {
    return await $fetch(target, {
      headers: {
        'Accept-Language': 'es',
      },
    });
  } catch (error) {
    forwardFetchError(error);
  }
});
