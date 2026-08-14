import type { QueryCache } from '@pinia/colada';

export const OPERATIONAL_BOARD_STALE_TIME_MS = 60_000;

/** Refresh all operational board queries (kanban columns, summaries, and list). */
export async function invalidateOperationalBoardCards(
  queryCache: QueryCache,
) {
  await queryCache.invalidateQueries({
    key: ['operational-rescue-cards'],
  });
  await queryCache.invalidateQueries({
    key: ['operational-rescue-cards-summary'],
  });
  await queryCache.invalidateQueries({
    key: ['operational-rescue-list'],
  });
}
