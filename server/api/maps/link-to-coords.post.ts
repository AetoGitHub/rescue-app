import type { MapsLinkToCoordsResponse } from '~/interfaces/maps/geocoding';
import { forwardFetchError } from '../../utils/forward-fetch-error';
import {
  parseMapsUrlBody,
  resolveN8nLinkToCoordsUrl,
} from '../../utils/maps-n8n';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readBody(event);
  const mapsUrl = parseMapsUrlBody(body?.maps_url);
  if (mapsUrl == null) {
    throw createError({
      statusCode: 400,
      message: 'Indica un enlace de Google Maps',
    });
  }

  try {
    return await $fetch<MapsLinkToCoordsResponse>(resolveN8nLinkToCoordsUrl(), {
      method: 'POST',
      body: { maps_url: mapsUrl },
    });
  } catch (error) {
    forwardFetchError(error);
  }
});
