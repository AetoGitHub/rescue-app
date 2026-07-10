import type { QueryCache } from '@pinia/colada';

/**
 * RTDB leaf `administrative_view_refresh` is a plain number (e.g. `2`).
 * Also accepts numeric strings for defensive parsing.
 */
export function readAdministrativeViewRefreshCount(
  value: unknown,
): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export async function invalidateAdministrativeBoardCards(
  queryCache: QueryCache,
) {
  await queryCache.invalidateQueries({
    key: ['administrative-rescue-cards'],
  });
  await queryCache.invalidateQueries({
    key: ['administrative-rescue-cards-summary'],
  });
  await queryCache.invalidateQueries({
    key: ['administrative-rescue-list'],
  });
}
