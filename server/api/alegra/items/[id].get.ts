import { accessCatalogs } from '#shared/abilities';
import { forwardFetchError } from '../../../utils/forward-fetch-error';
import {
  ALEGRA_ITEMS_BASE,
  resolveAlegraAuthorizationHeader,
} from '../../../utils/alegra-api';
import type { AlegraItem } from '~/interfaces/alegra/item.interface';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await authorize(event, accessCatalogs);

  const idParam = getRouterParam(event, 'id');
  const id = parseAlegraItemId(idParam);
  if (id == null) {
    throw createError({
      statusCode: 400,
      message: 'Identificador de ítem inválido',
    });
  }

  const authorization = resolveAlegraAuthorizationHeader();

  try {
    const data = await $fetch<AlegraItem>(`${ALEGRA_ITEMS_BASE}/${id}`, {
      query: { mode: 'simple' },
      headers: {
        accept: 'application/json',
        authorization,
      },
    });

    const display = formatAlegraItemDisplay(data);
    if (display == null) {
      throw createError({
        statusCode: 502,
        message: 'Respuesta inválida de Alegra',
      });
    }

    return display;
  } catch (error) {
    if (
      error
      && typeof error === 'object'
      && ('statusCode' in error || 'status' in error)
    ) {
      const statusCode = Number(
        (error as { statusCode?: number; status?: number }).statusCode
          ?? (error as { status?: number }).status,
      );
      if (statusCode === 404) {
        throw createError({
          statusCode: 404,
          message: 'Ítem no encontrado en Alegra',
        });
      }
    }

    forwardFetchError(error);
  }
});
