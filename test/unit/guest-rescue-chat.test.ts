import { describe, expect, it } from 'vitest';
import { guestChatMessageVariant } from '~/utils/guest-rescue-chat';

describe('guestChatMessageVariant', () => {
  it('marks tracked guest message ids as own', () => {
    const variant = guestChatMessageVariant(
      {
        id: 99,
        type: 'user',
        created_by_id: 1,
      },
      null,
      new Set([99]),
    );

    expect(variant).toBe('own');
  });
});
