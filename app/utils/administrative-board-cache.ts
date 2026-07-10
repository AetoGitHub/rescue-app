import type { QueryCache } from '@pinia/colada';

export function readAdministrativeViewRefreshCount(
  value: unknown,
): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'object' && 'count' in value) {
    const count = (value as { count: unknown }).count;
    if (typeof count === 'number' && Number.isFinite(count)) {
      return count;
    }
    if (typeof count === 'string' && count.trim() !== '') {
      const parsed = Number(count);
      return Number.isFinite(parsed) ? parsed : null;
    }
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
