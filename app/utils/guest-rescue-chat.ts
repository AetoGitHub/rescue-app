import type { RescueChatMessage } from '~/interfaces/rescue';

export function guestRescueChatQueryKey(rescueId: number, token: string) {
  return ['guest-rescue-chat-messages', rescueId, token] as const;
}

export function guestChatMessageVariant(
  message: Pick<RescueChatMessage, 'type' | 'id' | 'created_by_id'>,
  currentUserId: number | undefined | null,
  ownGuestMessageIds: ReadonlySet<number>,
): ReturnType<typeof getRescueChatMessageVariant> {
  if (ownGuestMessageIds.has(message.id)) return 'own';
  return getRescueChatMessageVariant(message, currentUserId);
}
