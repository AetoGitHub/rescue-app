import type { QueryCache } from '@pinia/colada';

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
