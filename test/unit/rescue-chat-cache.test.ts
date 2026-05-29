import { describe, expect, it, vi } from 'vitest';
import {
  invalidateRescueChatMessages,
  invalidateRescueDataAfterChatMessage,
  invalidateRescueKanbanCards,
} from '~/utils/rescue-chat-cache';

describe('invalidateRescueChatMessages', () => {
  it('invalidates chat messages query', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryCache = { invalidateQueries } as never;

    await invalidateRescueChatMessages(queryCache, 42);

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({
      key: ['rescue-chat-messages', 42],
    });
  });
});

describe('invalidateRescueKanbanCards', () => {
  it('invalidates operational rescue card queries', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryCache = { invalidateQueries } as never;

    await invalidateRescueKanbanCards(queryCache);

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({
      key: ['operational-rescue-cards'],
    });
  });
});

describe('invalidateRescueDataAfterChatMessage', () => {
  it('invalidates chat and kanban card queries without detail', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryCache = { invalidateQueries } as never;

    await invalidateRescueDataAfterChatMessage(queryCache, 42);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({
      key: ['rescue-chat-messages', 42],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      key: ['operational-rescue-cards'],
    });
  });
});
