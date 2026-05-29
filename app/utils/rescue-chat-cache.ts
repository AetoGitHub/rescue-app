import type { QueryCache } from '@pinia/colada';

/** Refresh kanban cards (last_comment_at) and open detail after a new chat message. */
export async function invalidateRescueDataAfterChatMessage(
  queryCache: QueryCache,
  rescueId: number,
) {
  await queryCache.invalidateQueries({
    key: ['rescue-chat-messages', rescueId],
  });
  await queryCache.invalidateQueries({
    key: ['rescue-card-detail', rescueId],
  });
  await queryCache.invalidateQueries({
    key: ['operational-rescue-cards'],
  });
}
