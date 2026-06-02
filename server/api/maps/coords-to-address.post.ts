import type { MapsCoordsToAddressResponse } from '~/interfaces/maps/geocoding';
import { forwardFetchError } from '../../utils/forward-fetch-error';
import {
  parseGeocodingLatLng,
  resolveN8nCoordsToAddressUrl,
} from '../../utils/maps-n8n';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readBody(event);
  const coords = parseGeocodingLatLng(body?.lat, body?.lng);
  if (coords == null) {
    throw createError({
      statusCode: 400,
      message: 'Indica latitud y longitud válidas',
    });
  }

  try {
    return await $fetch<MapsCoordsToAddressResponse>(
      resolveN8nCoordsToAddressUrl(),
      {
        method: 'POST',
        body: coords,
      },
    );
  } catch (error) {
    forwardFetchError(error);
  }
});
