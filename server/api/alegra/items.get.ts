import { accessCatalogs } from '#shared/abilities';
import { forwardFetchError } from '../../utils/forward-fetch-error';
import {
  ALEGRA_ITEMS_BASE,
  ALEGRA_ITEMS_LIMIT,
  buildAlegraItemsListQuery,
  fetchAlegraJson,
  mapAlegraItemsToDropdownResults,
  parseAlegraItemsListResponse,
  resolveAlegraAuthorizationHeader,
} from '../../utils/alegra-api';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await authorize(event, accessCatalogs);

  const query = getQuery(event);
  const name = typeof query.name === 'string' ? query.name : undefined;
  const startRaw = query.start;
  const start =
    startRaw != null && startRaw !== ''
      ? Number(startRaw)
      : 0;

  if (!Number.isInteger(start) || start < 0) {
    throw createError({
      statusCode: 400,
      message: 'Parámetro start inválido',
    });
  }

  const authorization = resolveAlegraAuthorizationHeader();

  try {
    const data = await fetchAlegraJson<unknown>(ALEGRA_ITEMS_BASE, {
      query: buildAlegraItemsListQuery({ query: name, start }),
      headers: {
        accept: 'application/json',
        authorization,
      },
    });

    const page = parseAlegraItemsListResponse(data);
    const results = mapAlegraItemsToDropdownResults(page.items);

    const fallbackNext =
      page.items.length >= ALEGRA_ITEMS_LIMIT
        ? String(start + ALEGRA_ITEMS_LIMIT)
        : null;
    const fallbackPrevious =
      start > 0 ? String(Math.max(0, start - ALEGRA_ITEMS_LIMIT)) : null;

    return {
      next: page.next ?? fallbackNext,
      previous: page.previous ?? fallbackPrevious,
      results,
    };
  } catch (error) {
    forwardFetchError(error);
  }
});
