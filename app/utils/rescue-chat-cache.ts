import type { QueryCache } from '@pinia/colada';

export async function invalidateRescueChatMessages(
  queryCache: QueryCache,
  rescueId: number,
) {
  await queryCache.invalidateQueries({
    key: ['rescue-chat-messages', rescueId],
  });
}

export async function invalidateRescueKanbanCards(queryCache: QueryCache) {
  await queryCache.invalidateQueries({
    key: ['operational-rescue-cards'],
  });
}

/** Refresh chat messages and kanban cards (last_comment_at) after a new chat message. */
export async function invalidateRescueDataAfterChatMessage(
  queryCache: QueryCache,
  rescueId: number,
) {
  await invalidateRescueChatMessages(queryCache, rescueId);
  await invalidateRescueKanbanCards(queryCache);
}
