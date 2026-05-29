import { describe, expect, it, vi } from 'vitest';
import { invalidateRescueDataAfterChatMessage } from '~/utils/rescue-chat-cache';

describe('invalidateRescueDataAfterChatMessage', () => {
  it('invalidates chat, detail and kanban card queries', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryCache = { invalidateQueries } as never;

    await invalidateRescueDataAfterChatMessage(queryCache, 42);

    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenCalledWith({
      key: ['rescue-chat-messages', 42],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      key: ['rescue-card-detail', 42],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      key: ['operational-rescue-cards'],
    });
  });
});
