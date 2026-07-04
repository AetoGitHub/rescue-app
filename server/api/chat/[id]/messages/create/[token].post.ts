import { joinURL } from 'ufo';
import { readBody } from 'h3';
import { forwardFetchError } from '../../../../../utils/forward-fetch-error';
import {
  parseRescueGuestIdParam,
  parseRescueGuestTokenParam,
  resolveRescueGuestApiUrl,
} from '../../../../../utils/rescue-guest-api';

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

  const body = await readBody(event);

  const target = joinURL(
    apiUrl,
    `/api/chat/${rescueId}/messages/create/${encodeURIComponent(token)}/`,
  );

  try {
    return await $fetch(target, {
      method: 'POST',
      body,
      headers: {
        'Accept-Language': 'es',
      },
    });
  } catch (error) {
    forwardFetchError(error);
  }
});
